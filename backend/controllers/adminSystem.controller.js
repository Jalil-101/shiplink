/**
 * Admin System Health Controller
 * Monitors system health and status
 */

const mongoose = require('mongoose');
const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin)
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    // Check database connection
    const dbStatus = dbStates[dbState] || 'unknown';
    const isDbHealthy = dbState === 1; // 1 = connected

    // Get recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: oneHourAgo } });
    const recentDeliveries = await DeliveryRequest.countDocuments({ createdAt: { $gte: oneHourAgo } });

    // Get error rates (if we had error tracking)
    const pendingDeliveries = await DeliveryRequest.countDocuments({ status: 'pending' });
    const stuckDeliveries = await DeliveryRequest.countDocuments({
      status: { $in: ['assigned', 'accepted'] },
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    });

    await createAuditLog(req, 'view_system_health', 'system', null);

    res.json({
      status: isDbHealthy ? 'healthy' : 'degraded',
      database: {
        status: dbStatus,
        connected: isDbHealthy
      },
      activity: {
        recentUsers,
        recentDeliveries,
        pendingDeliveries,
        stuckDeliveries
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error checking system health'
    });
  }
};

/**
 * @route   GET /api/admin/system/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
exports.getSystemStats = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      drivers: await Driver.countDocuments(),
      deliveries: await DeliveryRequest.countDocuments(),
      pendingDeliveries: await DeliveryRequest.countDocuments({ status: 'pending' }),
      activeDrivers: await Driver.countDocuments({ isAvailable: true }),
      suspendedUsers: await User.countDocuments({ isSuspended: true }),
      pendingVerifications: await Driver.countDocuments({ verificationStatus: 'pending' }),
    };

    await createAuditLog(req, 'view_system_stats', 'system', null);

    res.json({
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching system stats'
    });
  }
};




