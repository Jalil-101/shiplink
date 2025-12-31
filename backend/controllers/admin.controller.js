/**
 * Admin Controller
 * Handles admin authentication and profile management
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * Generate JWT token for admin
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide email and password'
      });
    }

    // Find admin and include password for comparison
    const admin = await AdminUser.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your admin account has been deactivated'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error during login'
    });
  }
};

/**
 * @route   GET /api/admin/me
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
exports.getProfile = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id);

    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching admin profile'
    });
  }
};

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout (client-side token removal)
 * @access  Private (Admin)
 */
exports.logout = async (req, res) => {
  try {
    await createAuditLog(req, 'logout', 'admin', req.admin._id.toString());
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error during logout'
    });
  }
};

