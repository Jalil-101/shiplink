/**
 * Admin Management Controller
 * Handles admin user management (super-admin only)
 */

const AdminUser = require('../models/AdminUser.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/admins
 * @desc    Get all admins
 * @access  Private (Super-Admin only)
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    let admins = await AdminUser.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      admins = admins.filter(admin => 
        admin.name.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower)
      );
    }

    const total = admins.length;
    const pages = Math.ceil(total / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedAdmins = admins.slice(startIndex, startIndex + parseInt(limit));

    await createAuditLog(req, 'view_admins', 'admins', null, { filters: query });

    res.json({
      admins: paginatedAdmins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching admins'
    });
  }
};

/**
 * @route   POST /api/admin/admins
 * @desc    Create new admin
 * @access  Private (Super-Admin only)
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, and password are required'
      });
    }

    if (role && !['super-admin', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role. Must be super-admin or admin'
      });
    }

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Admin with this email already exists'
      });
    }

    const admin = await AdminUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'admin'
    });

    await createAuditLog(
      req,
      'create_admin',
      'admin',
      admin._id,
      { name: admin.name, email: admin.email, role: admin.role }
    );

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating admin'
    });
  }
};

/**
 * @route   PATCH /api/admin/admins/:id/suspend
 * @desc    Suspend or unsuspend an admin
 * @access  Private (Super-Admin only)
 */
exports.suspendAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, suspend } = req.body;

    // Prevent suspending self
    if (id === req.admin._id.toString()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot suspend your own account'
      });
    }

    const admin = await AdminUser.findById(id);
    if (!admin) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Admin not found'
      });
    }

    // Prevent suspending super-admin
    if (admin.role === 'super-admin' && req.admin.role !== 'super-admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only super-admin can suspend other super-admins'
      });
    }

    const shouldSuspend = suspend !== undefined ? suspend : !admin.isActive;
    admin.isActive = !shouldSuspend;

    await admin.save();

    await createAuditLog(
      req,
      shouldSuspend ? 'suspend_admin' : 'unsuspend_admin',
      'admin',
      id,
      { reason, isActive: admin.isActive }
    );

    res.json({
      message: `Admin ${shouldSuspend ? 'suspended' : 'unsuspended'} successfully`,
      admin: {
        id: admin._id,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Suspend admin error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending admin'
    });
  }
};

/**
 * @route   PATCH /api/admin/admins/:id/role
 * @desc    Update admin role
 * @access  Private (Super-Admin only)
 */
exports.updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['super-admin', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role. Must be super-admin or admin'
      });
    }

    // Prevent changing own role
    if (id === req.admin._id.toString()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot change your own role'
      });
    }

    const admin = await AdminUser.findById(id);
    if (!admin) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Admin not found'
      });
    }

    const oldRole = admin.role;
    admin.role = role;
    await admin.save();

    await createAuditLog(
      req,
      'update_admin_role',
      'admin',
      id,
      { oldRole, newRole: role }
    );

    res.json({
      message: 'Admin role updated successfully',
      admin: {
        id: admin._id,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Update admin role error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating admin role'
    });
  }
};

