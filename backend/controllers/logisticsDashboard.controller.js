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
      createdOrders,
      assignedOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue,
      revenueThisMonth,
      revenueThisWeek,
      totalDrivers,
      activeDrivers
    ] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.countDocuments({ ...orderQuery, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ ...orderQuery, createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ ...orderQuery, status: 'created' }),
      Order.countDocuments({ ...orderQuery, status: 'provider_assigned' }),
      Order.countDocuments({ ...orderQuery, status: 'in_progress' }),
      Order.countDocuments({ ...orderQuery, status: 'completed' }),
      Order.countDocuments({ ...orderQuery, status: 'cancelled' }),
      Order.countDocuments({ ...orderQuery, status: 'failed' }),
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
          byStatus: {
            created: createdOrders,
            assigned: assignedOrders,
            inProgress: inProgressOrders,
            completed: completedOrders,
            cancelled: cancelledOrders,
            failed: failedOrders
          }
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
    const { 
      status, 
      order_type, 
      search, 
      destination, 
      startDate, 
      endDate, 
      carrier,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

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

    // Status filter
    if (status) query.status = status;
    
    // Order type filter
    if (order_type) query.order_type = order_type;
    
    // Search by order ID, orderNumber, or tracking ID
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { _id: search }
      ];
    }
    
    // Destination filter (city or country in dropoffLocation address)
    if (destination) {
      query['dropoffLocation.address'] = { $regex: destination, $options: 'i' };
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end date
        query.createdAt.$lte = end;
      }
    }
    
    // Carrier filter (if carrier field exists in Order model)
    if (carrier) {
      query.carrier = carrier;
    }

    // Sorting
    const sortOptions = {};
    const validSortFields = ['createdAt', 'gross_amount', 'status', 'orderNumber'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort(sortOptions)
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

/**
 * @route   GET /api/logistics-companies/dashboard/orders/:orderId
 * @desc    Get single order details
 * @access  Private (Logistics Company)
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Find order that belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    })
      .populate('userId', 'name email phone')
      .populate('driverId', 'userId vehicleType vehicleModel vehiclePlate')
      .populate('items.productId', 'name image');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching order details'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/orders/:orderId/schedule-pickup
 * @desc    Schedule pickup for an order
 * @access  Private (Logistics Company)
 */
exports.schedulePickup = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { date, time, notes } = req.body;

    if (!date) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Pickup date is required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Find order that belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    })
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Update scheduled pickup
    order.scheduledPickup = {
      date: new Date(date),
      time: time || null,
      notes: notes || null
    };

    await order.save();

    // Send notification to customer
    try {
      const { createNotification } = require('../utils/notificationService');
      await createNotification({
        userId: order.userId._id,
        title: 'Pickup Scheduled',
        message: `Your pickup has been scheduled for ${new Date(date).toLocaleDateString()}${time ? ' at ' + time : ''}`,
        category: 'deliveries',
        type: 'info',
        actionUrl: `/track/${order.order_id}`,
        relatedId: order._id,
        relatedType: 'Order',
        metadata: { orderNumber: order.orderNumber }
      });

      // Send email notification if email service is configured
      const emailService = require('../services/emailService');
      await emailService.sendPickupConfirmationEmail(order.userId, order, date);
    } catch (notifError) {
      console.error('Error sending pickup notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Pickup scheduled successfully',
      order
    });
  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error scheduling pickup'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/orders/:orderId/schedule-delivery
 * @desc    Schedule delivery for an order
 * @access  Private (Logistics Company)
 */
exports.scheduleDelivery = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { date, time, notes } = req.body;

    if (!date) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Delivery date is required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Find order that belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    })
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Validate: delivery should be after pickup
    if (order.scheduledPickup && order.scheduledPickup.date) {
      const pickupDate = new Date(order.scheduledPickup.date);
      const deliveryDate = new Date(date);
      if (deliveryDate < pickupDate) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Delivery date must be after pickup date'
        });
      }
    }

    // Update scheduled delivery
    order.scheduledDelivery = {
      date: new Date(date),
      time: time || null,
      notes: notes || null
    };

    await order.save();

    // Send notification to customer
    try {
      const { createNotification } = require('../utils/notificationService');
      await createNotification({
        userId: order.userId._id,
        title: 'Delivery Scheduled',
        message: `Your delivery has been scheduled for ${new Date(date).toLocaleDateString()}${time ? ' at ' + time : ''}`,
        category: 'deliveries',
        type: 'info',
        actionUrl: `/track/${order.order_id}`,
        relatedId: order._id,
        relatedType: 'Order',
        metadata: { orderNumber: order.orderNumber }
      });
    } catch (notifError) {
      console.error('Error sending delivery notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Delivery scheduled successfully',
      order
    });
  } catch (error) {
    console.error('Schedule delivery error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error scheduling delivery'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/orders/:orderId/assign-driver
 * @desc    Assign a driver to an order
 * @access  Private (Logistics Company)
 */
exports.assignDriver = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver ID is required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Verify driver belongs to this company
    const driver = await Driver.findOne({
      _id: driverId,
      logisticsCompanyId: company._id
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found or does not belong to your company'
      });
    }

    // Find order that belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    })
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Assign driver
    order.driverId = driverId;
    order.assignedAt = new Date();
    
    // Update status if needed
    if (order.status === 'created') {
      order.status = 'provider_assigned';
      order.statusHistory.push({
        status: 'provider_assigned',
        changedAt: new Date(),
        changedBy: userId,
        reason: 'Driver assigned'
      });
    }

    await order.save();

    // Send notification to customer
    try {
      const { createNotification } = require('../utils/notificationService');
      await createNotification({
        userId: order.userId._id,
        title: 'Driver Assigned',
        message: `A driver has been assigned to your order ${order.orderNumber || order.order_id}`,
        category: 'deliveries',
        type: 'info',
        actionUrl: `/track/${order.order_id}`,
        relatedId: order._id,
        relatedType: 'Order',
        metadata: { orderNumber: order.orderNumber }
      });
    } catch (notifError) {
      console.error('Error sending driver assignment notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Driver assigned successfully',
      order
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error assigning driver'
    });
  }
};

