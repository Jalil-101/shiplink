/**
 * Logistics Tracking Controller
 * Handles real-time tracking for logistics companies
 */

const Order = require('../models/Order.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');
const Driver = require('../models/Driver.model');

/**
 * @route   GET /api/logistics-companies/dashboard/tracking/:orderId
 * @desc    Get real-time tracking data for an order
 * @access  Private (Logistics Company)
 */
exports.getTrackingData = async (req, res) => {
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
      .populate('driverId', 'userId vehicleType vehicleModel vehiclePlate location')
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Get driver's current location if driver is assigned
    let driverLocation = null;
    if (order.driverId && order.driverId.location) {
      driverLocation = {
        latitude: order.driverId.location.latitude,
        longitude: order.driverId.location.longitude,
        lastUpdated: order.driverId.location.lastUpdated
      };
    }

    res.json({
      order: {
        _id: order._id,
        order_id: order.order_id,
        orderNumber: order.orderNumber,
        status: order.status,
        pickupLocation: order.pickupLocation,
        dropoffLocation: order.dropoffLocation,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        actualDeliveryTime: order.actualDeliveryTime
      },
      trackingHistory: order.trackingHistory || [],
      driverLocation,
      driver: order.driverId ? {
        _id: order.driverId._id,
        vehicleType: order.driverId.vehicleType,
        vehicleModel: order.driverId.vehicleModel,
        vehiclePlate: order.driverId.vehiclePlate
      } : null
    });
  } catch (error) {
    console.error('Get tracking data error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching tracking data'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/tracking/:orderId/update
 * @desc    Update tracking location for an order
 * @access  Private (Logistics Company)
 */
exports.updateTrackingLocation = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { latitude, longitude, status, carrier, notes } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
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
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Add tracking history entry
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date(),
      status: status || order.status,
      carrier: carrier || null,
      notes: notes || null
    });

    await order.save();

    // Emit real-time update via Socket.io
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.to(`order:${orderId}`).emit('tracking:update', {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
        status: status || order.status
      });
    } catch (socketError) {
      console.error('Error emitting tracking update:', socketError);
      // Don't fail the request if socket fails
    }

    res.json({
      message: 'Tracking location updated successfully',
      trackingEntry: order.trackingHistory[order.trackingHistory.length - 1]
    });
  } catch (error) {
    console.error('Update tracking location error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating tracking location'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/tracking
 * @desc    Get all active tracking orders for the company
 * @access  Private (Logistics Company)
 */
exports.getAllTrackingOrders = async (req, res) => {
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

    // Get active orders (not completed, cancelled, or failed)
    const activeOrders = await Order.find({
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      status: { $in: ['created', 'provider_assigned', 'in_progress'] },
      softDelete: false
    })
      .select('_id order_id orderNumber status pickupLocation dropoffLocation trackingHistory driverId estimatedDeliveryTime')
      .populate('driverId', 'vehicleType vehicleModel location')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      orders: activeOrders.map(order => ({
        _id: order._id,
        order_id: order.order_id,
        orderNumber: order.orderNumber,
        status: order.status,
        pickupLocation: order.pickupLocation,
        dropoffLocation: order.dropoffLocation,
        latestTracking: order.trackingHistory && order.trackingHistory.length > 0
          ? order.trackingHistory[order.trackingHistory.length - 1]
          : null,
        driverLocation: order.driverId && order.driverId.location
          ? {
              latitude: order.driverId.location.latitude,
              longitude: order.driverId.location.longitude,
              lastUpdated: order.driverId.location.lastUpdated
            }
          : null,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }))
    });
  } catch (error) {
    console.error('Get all tracking orders error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching tracking orders'
    });
  }
};

