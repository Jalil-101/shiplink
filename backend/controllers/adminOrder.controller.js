/**
 * Admin Order Management Controller
 */

const Order = require('../models/Order.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with filters
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('deliveryRequestId', 'status driverId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    await createAuditLog(req, 'view_orders', 'orders', null, { filters: query });

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
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching orders'
    });
  }
};

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get order by ID
 * @access  Private (Admin)
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name images')
      .populate('deliveryRequestId', 'status driverId pickupLocation dropoffLocation');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    await createAuditLog(req, 'view_order', 'order', req.params.id);

    res.json({
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching order'
    });
  }
};

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    order.status = status;
    if (notes) order.notes = notes;
    
    await order.save();

    await createAuditLog(
      req,
      'update_order_status',
      'order',
      id,
      { previousStatus, newStatus: status }
    );

    // Emit real-time update
    if (req.io) {
      req.io.emit('order:status-updated', {
        orderId: id,
        status,
        userId: order.userId.toString()
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating order status'
    });
  }
};

