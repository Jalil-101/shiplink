/**
 * Logistics Dashboard Controller
 * Handles dashboard data for logistics companies
 */

const LogisticsCompany = require('../models/LogisticsCompany.model');
const Order = require('../models/Order.model');
const Driver = require('../models/Driver.model');
const User = require('../models/User.model');

/**
 * @route   GET /api/logistics-companies/dashboard/overview
 * @desc    Get logistics company dashboard overview
 * @access  Private (Logistics Company)
 */
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Get orders where this company is the provider
    const orderQuery = {
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    const [
      totalOrders,
      ordersThisMonth,
      ordersThisWeek,
      completedOrders,
      pendingOrders,
      inProgressOrders,
      totalRevenue,
      revenueThisMonth,
      revenueThisWeek,
      totalDrivers,
      activeDrivers
    ] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.countDocuments({ ...orderQuery, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ ...orderQuery, createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ ...orderQuery, status: 'completed' }),
      Order.countDocuments({ ...orderQuery, status: 'created' }),
      Order.countDocuments({ ...orderQuery, status: 'in_progress' }),
      Order.aggregate([
        { $match: { ...orderQuery, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$gross_amount' } } }
      ]),
      Order.aggregate([
        { $match: { ...orderQuery, status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$gross_amount' } } }
      ]),
      Order.aggregate([
        { $match: { ...orderQuery, status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$gross_amount' } } }
      ]),
      Driver.countDocuments({ logisticsCompanyId: company._id }),
      Driver.countDocuments({ logisticsCompanyId: company._id, isAvailable: true })
    ]);

    res.json({
      overview: {
        company: {
          id: company._id,
          companyName: company.companyName,
          rating: company.rating,
          totalShipments: company.totalShipments,
          isVerified: company.isVerified,
          verificationStatus: company.verificationStatus
        },
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          thisWeek: ordersThisWeek,
          completed: completedOrders,
          pending: pendingOrders,
          inProgress: inProgressOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
          thisWeek: revenueThisWeek[0]?.total || 0
        },
        drivers: {
          total: totalDrivers,
          active: activeDrivers
        }
      }
    });
  } catch (error) {
    console.error('Get logistics dashboard overview error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching dashboard overview'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/orders
 * @desc    Get logistics company orders
 * @access  Private (Logistics Company)
 */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, order_type, page = 1, limit = 20 } = req.query;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const query = {
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    if (status) query.status = status;
    if (order_type) query.order_type = order_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get logistics company orders error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching orders'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/analytics
 * @desc    Get logistics company analytics
 * @access  Private (Logistics Company)
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period = '30' } = req.query; // days

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const orderQuery = {
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false,
      createdAt: { $gte: startDate }
    };

    // Orders over time
    const ordersOverTime = await Order.aggregate([
      { $match: orderQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$gross_amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { ...orderQuery, createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Orders by type
    const ordersByType = await Order.aggregate([
      { $match: { ...orderQuery, createdAt: { $gte: startDate } } },
      { $group: { _id: '$order_type', count: { $sum: 1 }, revenue: { $sum: '$gross_amount' } } }
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { ...orderQuery, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$gross_amount' } } }
    ]);

    res.json({
      ordersOverTime,
      ordersByStatus,
      ordersByType,
      averageOrderValue: avgOrderValue[0]?.avg || 0
    });
  } catch (error) {
    console.error('Get logistics company analytics error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching analytics'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/drivers
 * @desc    Get logistics company drivers
 * @access  Private (Logistics Company)
 */
exports.getDrivers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Get drivers by logisticsCompanyId (preferred) or from company.drivers array (fallback)
    let drivers;
    const driversByCompanyId = await Driver.find({ logisticsCompanyId: company._id })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    if (driversByCompanyId.length > 0) {
      drivers = driversByCompanyId;
    } else {
      // Fallback to company.drivers array for backward compatibility
      const driverIds = company.drivers || [];
      drivers = await Driver.find({ _id: { $in: driverIds } })
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });
    }

    res.json({
      drivers,
      count: drivers.length
    });
  } catch (error) {
    console.error('Get logistics company drivers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching drivers'
    });
  }
};

