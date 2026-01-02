/**
 * Admin Analytics Controller
 * Provides analytics and reporting data
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const Order = require('../models/Order.model');
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
      totalOrders,
      ordersThisMonth,
      ordersThisWeek,
      completedOrders,
      pendingOrders,
      totalRevenue,
      revenueThisMonth,
      pendingVerifications,
      approvedDrivers,
    ] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments(),
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      Order.countDocuments({ softDelete: false }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth }, softDelete: false }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek }, softDelete: false }),
      Order.countDocuments({ status: 'completed', softDelete: false }),
      Order.countDocuments({ status: 'created', softDelete: false }),
      Order.aggregate([
        { $match: { status: 'completed', softDelete: false } },
        { $group: { _id: null, total: { $sum: '$gross_amount' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth }, softDelete: false } },
        { $group: { _id: null, total: { $sum: '$gross_amount' } } }
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
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          thisWeek: ordersThisWeek,
          completed: completedOrders,
          pending: pendingOrders,
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
 * @route   GET /api/admin/analytics/orders
 * @desc    Get order analytics (using unified Order model)
 * @access  Private (Admin)
 */
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { period = '30', order_type } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const matchQuery = {
      createdAt: { $gte: startDate },
      softDelete: false
    };

    if (order_type) {
      matchQuery.order_type = order_type;
    }

    // Orders over time
    const ordersOverTime = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$gross_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { softDelete: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Orders by type
    const ordersByType = await Order.aggregate([
      { $match: { softDelete: false } },
      { $group: { _id: '$order_type', count: { $sum: 1 }, revenue: { $sum: '$gross_amount' } } },
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { status: 'completed', softDelete: false } },
      { $group: { _id: null, avg: { $avg: '$gross_amount' } } },
    ]);

    await createAuditLog(req, 'view_order_analytics', 'analytics', null);

    res.json({
      ordersOverTime,
      ordersByStatus,
      ordersByType,
      averageOrderValue: avgOrderValue[0]?.avg || 0,
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching order analytics',
    });
  }
};

// Keep backward compatibility
exports.getDeliveryAnalytics = exports.getOrderAnalytics;




