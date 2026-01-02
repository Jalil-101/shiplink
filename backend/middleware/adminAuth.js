/**
 * Admin Authentication Middleware
 * Verifies admin JWT tokens and checks admin role
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser.model');

/**
 * Protect admin routes - verify admin JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please login to access this resource.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get admin from token
      const admin = await AdminUser.findById(decoded.id).select('-password');
      
      if (!admin) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Admin not found. Token may be invalid.'
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your admin account has been deactivated.'
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please login again.'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Error authenticating admin'
    });
  }
};

/**
 * Restrict routes to specific admin roles
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You don't have permission to perform this action. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Create audit log entry
 * Updated to use new AuditLog schema with event_type, actor_id, and actorModel
 */
const createAuditLog = async (req, action, resource, resourceId = null, details = {}, status = 'success', errorMessage = null) => {
  try {
    const AuditLog = require('../models/AuditLog.model');
    
    // Map action to event_type (default to 'admin_action' for admin operations)
    const eventType = 'admin_action';
    
    await AuditLog.create({
      event_type: eventType,
      actor_id: req.admin._id,
      actorModel: 'AdminUser',
      adminId: req.admin._id, // Keep for backward compatibility
      action, // Keep for backward compatibility
      resource, // Keep for backward compatibility
      resourceId: resourceId?.toString() || null, // Keep for backward compatibility
      details, // Keep for backward compatibility
      metadata: details, // Use details as metadata
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status,
      errorMessage
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't fail the request if audit logging fails
  }
};

module.exports = { protect, restrictTo, createAuditLog };

