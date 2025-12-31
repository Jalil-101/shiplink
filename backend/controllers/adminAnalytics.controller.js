/**
 * Admin Analytics Controller
 * Provides analytics and reporting data
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const AuditLog = require('../models/AuditLog.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get dashboard overview statistics
 * @access  Private (Admin)
 */
exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Get all stats in parallel
    const [
      totalUsers,
      totalDrivers,
      activeUsers,
      suspendedUsers,
      totalDeliveries,
      deliveriesThisMonth,
      deliveriesThisWeek,
      completedDeliveries,
      pendingDeliveries,
      totalRevenue,
      revenueThisMonth,
      pendingVerifications,
      approvedDrivers,
    ] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments(),
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      DeliveryRequest.countDocuments(),
      DeliveryRequest.countDocuments({ createdAt: { $gte: startOfMonth } }),
      DeliveryRequest.countDocuments({ createdAt: { $gte: startOfWeek } }),
      DeliveryRequest.countDocuments({ status: 'delivered' }),
      DeliveryRequest.countDocuments({ status: 'pending' }),
      DeliveryRequest.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      DeliveryRequest.aggregate([
        { $match: { status: 'delivered', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      Driver.countDocuments({ verificationStatus: 'pending' }),
      Driver.countDocuments({ verificationStatus: 'approved' }),
    ]);

    await createAuditLog(req, 'view_analytics', 'analytics', null);

    res.json({
      overview: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
        },
        drivers: {
          total: totalDrivers,
          approved: approvedDrivers,
          pendingVerification: pendingVerifications,
        },
        deliveries: {
          total: totalDeliveries,
          thisMonth: deliveriesThisMonth,
          thisWeek: deliveriesThisWeek,
          completed: completedDeliveries,
          pending: pendingDeliveries,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching analytics',
    });
  }
};

/**
 * @route   GET /api/admin/analytics/users
 * @desc    Get user analytics
 * @access  Private (Admin)
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // User registrations over time
    const registrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    await createAuditLog(req, 'view_user_analytics', 'analytics', null);

    res.json({
      registrations,
      usersByRole,
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching user analytics',
    });
  }
};

/**
 * @route   GET /api/admin/analytics/deliveries
 * @desc    Get delivery analytics
 * @access  Private (Admin)
 */
exports.getDeliveryAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Deliveries over time
    const deliveriesOverTime = await DeliveryRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Deliveries by status
    const deliveriesByStatus = await DeliveryRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Average delivery value
    const avgDeliveryValue = await DeliveryRequest.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, avg: { $avg: '$price' } } },
    ]);

    await createAuditLog(req, 'view_delivery_analytics', 'analytics', null);

    res.json({
      deliveriesOverTime,
      deliveriesByStatus,
      averageDeliveryValue: avgDeliveryValue[0]?.avg || 0,
    });
  } catch (error) {
    console.error('Get delivery analytics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching delivery analytics',
    });
  }
};

