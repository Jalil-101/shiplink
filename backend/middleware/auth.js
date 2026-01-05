/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Protect routes - verify JWT token
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
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found. Token may be invalid.'
        });
      }

      // Ensure activeRole is set and valid
      if (!req.user.activeRole) {
        req.user.activeRole = req.user.role || 'user';
        req.user.role = req.user.activeRole; // Sync legacy field
        await req.user.save();
      }

      // Sync legacy role field with activeRole
      if (req.user.activeRole !== req.user.role) {
        req.user.role = req.user.activeRole;
        // Don't save here to avoid unnecessary DB calls - will sync on next save
      }

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
      message: 'Error authenticating user'
    });
  }
};

/**
 * Validate active role on every request
 * Ensures user's activeRole is valid and they have permission to use it
 */
const validateActiveRole = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please login to access this resource'
      });
    }

    const activeRole = req.user.activeRole || req.user.role || 'user';
    
    // Check if user has this role
    const hasRole = req.user.roles?.some(r => r.role === activeRole) || activeRole === 'user';
    
    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You don't have the ${activeRole} role. Please switch to an available role.`
      });
    }

    // Check if role is verified (required for non-user roles)
    if (activeRole !== 'user') {
      const roleEntry = req.user.roles?.find(r => r.role === activeRole);
      if (roleEntry && !roleEntry.verified) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Your ${activeRole} role is pending verification. Please wait for admin approval.`
        });
      }
    }

    // Ensure activeRole is set on request
    req.user.activeRole = activeRole;
    req.user.role = activeRole; // Sync legacy field

    next();
  } catch (error) {
    console.error('Error validating active role:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error validating active role'
    });
  }
};

/**
 * Restrict routes to specific roles
 * Checks if user has ANY of the required roles (verified), regardless of activeRole
 * This allows users with multiple roles to access features for any of their verified roles
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please login to access this resource'
      });
    }

    const activeRole = req.user.activeRole || req.user.role;
    
    // Check if activeRole matches (fast path)
    if (roles.includes(activeRole)) {
      // Verify the role is actually verified (for non-user roles)
      if (activeRole === 'user') {
        // 'user' role is always available
        return next();
      }
      
      const roleEntry = req.user.roles?.find(r => r.role === activeRole);
      if (roleEntry && roleEntry.verified) {
        return next();
      }
    }
    
    // Check if user has ANY of the required roles in their roles array (even if not active)
    // This allows users to access features for any of their verified roles
    const hasRequiredRole = roles.some(requiredRole => {
      if (requiredRole === 'user') {
        // 'user' role is always available to all users
        return true;
      }
      
      const roleEntry = req.user.roles?.find(r => r.role === requiredRole);
      return roleEntry && roleEntry.verified;
    });
    
    if (hasRequiredRole) {
      // User has the required role, but it's not active
      // Allow access but include a hint in the response
      // The frontend can handle this gracefully
      return next();
    }
    
    // User doesn't have any of the required roles
    const userRoles = req.user.roles?.filter(r => r.verified).map(r => r.role) || [];
    if (userRoles.length === 0) {
      userRoles.push('user'); // All users have at least 'user' role
    }
    
    return res.status(403).json({
      error: 'Forbidden',
      message: `You don't have permission to perform this action. Required role: ${roles.join(' or ')}. Your verified roles: ${userRoles.join(', ')}`,
      requiredRoles: roles,
      userRoles: userRoles,
      activeRole: activeRole,
      hint: userRoles.some(r => roles.includes(r)) 
        ? 'You have this role but it is not currently active. Switch roles to access this feature.'
        : 'You need to apply for and get approved for this role to access this feature.'
    });
  };
};

module.exports = { protect, restrictTo, validateActiveRole };






