/**
 * Admin Role Application Review Controller
 * Handles review and approval/rejection of role applications
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const Seller = require('../models/Seller.model');
const SourcingAgent = require('../models/SourcingAgent.model');
const ImportCoach = require('../models/ImportCoach.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/role-applications
 * @desc    Get all pending role applications
 * @access  Private (Admin)
 */
exports.getAllApplications = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    // Get all users with pending roles
    const query = {
      'roles.verified': false
    };

    if (role) {
      query['roles.role'] = role;
    }

    const users = await User.find(query)
      .select('name email phone roles createdAt')
      .sort({ createdAt: -1 });

    // Flatten to get individual role applications
    let applications = [];
    users.forEach(user => {
      user.roles.forEach(roleEntry => {
        if (!roleEntry.verified) {
          applications.push({
            id: `${user._id}_${roleEntry.role}`,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            role: roleEntry.role,
            requestedAt: roleEntry.requestedAt,
            createdAt: user.createdAt
          });
        }
      });
    });

    // Filter by status if provided
    if (status) {
      // Status filtering would require checking profile verification status
      // For now, all are 'pending' since verified is false
    }

    const total = applications.length;
    const pages = Math.ceil(total / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedApplications = applications.slice(startIndex, startIndex + parseInt(limit));

    // Get profile details for each application
    const applicationsWithDetails = await Promise.all(
      paginatedApplications.map(async (app) => {
        let profile = null;
        try {
          switch (app.role) {
            case 'driver':
              profile = await Driver.findOne({ userId: app.userId });
              break;
            case 'seller':
              profile = await Seller.findOne({ userId: app.userId });
              break;
            case 'sourcing-agent':
              profile = await SourcingAgent.findOne({ userId: app.userId });
              break;
            case 'import-coach':
              profile = await ImportCoach.findOne({ userId: app.userId });
              break;
          }
        } catch (error) {
          console.error(`Error fetching ${app.role} profile:`, error);
        }

        return {
          ...app,
          profile: profile ? profile.toObject() : null
        };
      })
    );

    await createAuditLog(req, 'view_role_applications', 'role_applications', null, { filters: query });

    res.json({
      applications: applicationsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all role applications error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching role applications'
    });
  }
};

/**
 * @route   GET /api/admin/role-applications/:userId/:role
 * @desc    Get role application details
 * @access  Private (Admin)
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { userId, role } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const roleEntry = user.roles?.find(r => r.role === role);
    if (!roleEntry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role application not found'
      });
    }

    // Get role-specific profile
    let profile = null;
    try {
      switch (role) {
        case 'driver':
          profile = await Driver.findOne({ userId }).populate('userId');
          break;
        case 'seller':
          profile = await Seller.findOne({ userId }).populate('userId');
          break;
        case 'sourcing-agent':
          profile = await SourcingAgent.findOne({ userId }).populate('userId');
          break;
        case 'import-coach':
          profile = await ImportCoach.findOne({ userId }).populate('userId');
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${role} profile:`, error);
    }

    await createAuditLog(req, 'view_role_application', 'role_application', `${userId}_${role}`);

    res.json({
      application: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        role: roleEntry.role,
        requestedAt: roleEntry.requestedAt,
        verified: roleEntry.verified,
        verifiedAt: roleEntry.verifiedAt,
        verifiedBy: roleEntry.verifiedBy,
        profile: profile ? profile.toObject() : null
      }
    });
  } catch (error) {
    console.error('Get role application by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching role application'
    });
  }
};

/**
 * @route   PATCH /api/admin/role-applications/:userId/:role/approve
 * @desc    Approve role application
 * @access  Private (Admin)
 */
exports.approveApplication = async (req, res) => {
  try {
    const { userId, role } = req.params;
    const { notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const roleEntry = user.roles?.find(r => r.role === role);
    if (!roleEntry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role application not found'
      });
    }

    if (roleEntry.verified) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role application already approved'
      });
    }

    // Update role entry
    roleEntry.verified = true;
    roleEntry.verifiedAt = new Date();
    roleEntry.verifiedBy = req.admin._id;

    // If this is the first verified role and user is still on 'user' role, switch to this role
    if (user.activeRole === 'user' && role !== 'user') {
      user.activeRole = role;
      user.role = role; // Sync legacy field
    }

    await user.save();

    // Update role-specific profile verification status
    try {
      switch (role) {
        case 'driver':
          await Driver.updateOne(
            { userId },
            { verificationStatus: 'approved', verifiedAt: new Date(), verifiedBy: req.admin._id }
          );
          break;
        case 'seller':
          await Seller.updateOne(
            { userId },
            { verificationStatus: 'approved', verifiedAt: new Date(), verifiedBy: req.admin._id }
          );
          break;
        case 'sourcing-agent':
          await SourcingAgent.updateOne(
            { userId },
            { verificationStatus: 'approved', verifiedAt: new Date(), verifiedBy: req.admin._id }
          );
          break;
        case 'import-coach':
          await ImportCoach.updateOne(
            { userId },
            { verificationStatus: 'approved', verifiedAt: new Date(), verifiedBy: req.admin._id }
          );
          break;
      }
    } catch (profileError) {
      console.error(`Error updating ${role} profile:`, profileError);
      // Don't fail the request
    }

    await createAuditLog(
      req,
      'approve_role_application',
      'role_application',
      `${userId}_${role}`,
      { notes }
    );

    res.json({
      message: 'Role application approved successfully',
      application: {
        userId: user._id,
        role: roleEntry.role,
        verified: roleEntry.verified,
        verifiedAt: roleEntry.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve role application error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving role application'
    });
  }
};

/**
 * @route   PATCH /api/admin/role-applications/:userId/:role/reject
 * @desc    Reject role application
 * @access  Private (Admin)
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { userId, role } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rejection notes are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const roleEntry = user.roles?.find(r => r.role === role);
    if (!roleEntry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role application not found'
      });
    }

    // Remove the role from user's roles array
    user.roles = user.roles.filter(r => r.role !== role);
    
    // If user was active in this role, switch back to 'user'
    if (user.activeRole === role) {
      user.activeRole = 'user';
      user.role = 'user';
    }

    await user.save();

    // Update role-specific profile verification status
    try {
      switch (role) {
        case 'driver':
          await Driver.updateOne(
            { userId },
            { verificationStatus: 'rejected', verificationNotes: notes, verifiedBy: req.admin._id }
          );
          break;
        case 'seller':
          await Seller.updateOne(
            { userId },
            { verificationStatus: 'rejected', verificationNotes: notes, verifiedBy: req.admin._id }
          );
          break;
        case 'sourcing-agent':
          await SourcingAgent.updateOne(
            { userId },
            { verificationStatus: 'rejected', verificationNotes: notes, verifiedBy: req.admin._id }
          );
          break;
        case 'import-coach':
          await ImportCoach.updateOne(
            { userId },
            { verificationStatus: 'rejected', verificationNotes: notes, verifiedBy: req.admin._id }
          );
          break;
      }
    } catch (profileError) {
      console.error(`Error updating ${role} profile:`, profileError);
      // Don't fail the request
    }

    await createAuditLog(
      req,
      'reject_role_application',
      'role_application',
      `${userId}_${role}`,
      { notes }
    );

    res.json({
      message: 'Role application rejected successfully',
      application: {
        userId: user._id,
        role: role,
        rejected: true,
        notes
      }
    });
  } catch (error) {
    console.error('Reject role application error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting role application'
    });
  }
};

