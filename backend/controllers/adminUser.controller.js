/**
 * Admin User Management Controller
 * Handles user management operations by admins
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isSuspended, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    await createAuditLog(req, 'view_users', 'users', null, { filters: query });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching users'
    });
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with full details
 * @access  Private (Admin)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get driver profile if user is a driver
    let driverProfile = null;
    if (user.role === 'driver') {
      driverProfile = await Driver.findOne({ userId: user._id });
    }

    await createAuditLog(req, 'view_user', 'user', req.params.id);

    res.json({
      user,
      driverProfile
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user'
    });
  }
};

/**
 * @route   PATCH /api/admin/users/:id/suspend
 * @desc    Suspend or unsuspend a user account
 * @access  Private (Admin)
 */
exports.suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    user.isSuspended = !user.isSuspended;
    user.suspensionReason = reason || null;
    user.suspendedAt = user.isSuspended ? new Date() : null;
    
    await user.save();

    await createAuditLog(
      req,
      user.isSuspended ? 'suspend_user' : 'unsuspend_user',
      'user',
      id,
      { reason, suspended: user.isSuspended }
    );

    res.json({
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: user._id,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        suspendedAt: user.suspendedAt
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending user'
    });
  }
};

/**
 * @route   POST /api/admin/users/:id/force-logout
 * @desc    Force logout user by invalidating their token (client-side implementation)
 * @access  Private (Admin)
 */
exports.forceLogout = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update last activity to force token refresh
    user.lastActivity = new Date();
    await user.save();

    await createAuditLog(req, 'force_logout', 'user', id);

    res.json({
      message: 'User will be logged out on next token validation',
      user: {
        id: user._id,
        lastActivity: user.lastActivity
      }
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error forcing logout'
    });
  }
};

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity history
 * @access  Private (Admin)
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get audit logs related to this user
    const AuditLog = require('../models/AuditLog.model');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find({
      $or: [
        { resourceId: id },
        { 'details.userId': id }
      ]
    })
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments({
      $or: [
        { resourceId: id },
        { 'details.userId': id }
      ]
    });

    await createAuditLog(req, 'view_user_activity', 'user', id);

    res.json({
      activity: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user activity'
    });
  }
};

