/**
 * Logistics Authentication Middleware
 * Verifies user has logistics-company role
 */

const User = require('../models/User.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * Restrict routes to logistics company users
 */
const restrictToLogisticsCompany = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please login to access this resource'
      });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Check if user has logistics-company role
    const hasLogisticsRole = user.roles?.some(r => r.role === 'logistics-company' && r.verified) ||
                             user.role === 'logistics-company';

    if (!hasLogisticsRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This endpoint is only accessible to logistics companies'
      });
    }

    // Verify logistics company profile exists
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found. Please create your profile first.'
      });
    }

    // Check if company is active and verified
    if (!company.isActive || company.verificationStatus !== 'approved') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your logistics company account is not active or verified'
      });
    }

    // Attach company to request for use in controllers
    req.logisticsCompany = company;

    next();
  } catch (error) {
    console.error('Logistics auth middleware error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error verifying logistics company access'
    });
  }
};

module.exports = { restrictToLogisticsCompany };

