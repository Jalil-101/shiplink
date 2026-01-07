/**
 * Unified Order Controller
 * Handles all order types: delivery, marketplace, sourcing, coaching
 * Implements strict state machine and backend-only commission calculation
 */

const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const Driver = require('../models/Driver.model');
const Settings = require('../models/Settings.model');
const { calculateDistance, calculateEstimatedTime, calculatePrice } = require('../utils/distance');
const { calculateCommission, canModifyCommission } = require('../utils/commissionCalculator');
const {
  logOrderCreated,
  logOrderStatusChanged,
  logOrderCancelled,
  logOrderCompleted,
  logCommissionCalculated
} = require('../utils/eventLogger');
const { createNotification } = require('../utils/notificationService');

/**
 * Calculate delivery fee
 */
async function calculateDeliveryFee(pickupLocation, dropoffLocation, isFreeDelivery = false) {
  if (isFreeDelivery) return 0;

  const settings = await Settings.findOne({ key: 'deliveryBasePrice' });
  const basePrice = settings?.value || 5.00;

  const pricePerKmSettings = await Settings.findOne({ key: 'deliveryPricePerKm' });
  const pricePerKm = pricePerKmSettings?.value || 1.50;

  if (!pickupLocation || !dropoffLocation) {
    return basePrice;
  }

  const distance = calculateDistance(
    pickupLocation.latitude,
    pickupLocation.longitude,
    dropoffLocation.latitude,
    dropoffLocation.longitude
  );

  return basePrice + (distance * pricePerKm);
}

/**
 * Create a unified order (supports all order types)
 */
exports.createOrder = async (req, res) => {
  try {
    const { order_type, ...orderData } = req.body;

    if (!order_type) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'order_type is required. Must be one of: delivery, marketplace, sourcing, coaching'
      });
    }

    const validOrderTypes = ['delivery', 'marketplace', 'sourcing', 'coaching'];
    if (!validOrderTypes.includes(order_type)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`
      });
    }

    let order;
    let grossAmount = 0;

    // Create order based on type
    switch (order_type) {
      case 'delivery':
        order = await createDeliveryOrder(req.user._id, orderData);
        grossAmount = order.gross_amount;
        break;

      case 'marketplace':
        order = await createMarketplaceOrder(req.user._id, orderData, req);
        grossAmount = order.gross_amount;
        break;

      case 'sourcing':
        order = await createSourcingOrder(req.user._id, orderData);
        grossAmount = order.gross_amount;
        break;

      case 'coaching':
        order = await createCoachingOrder(req.user._id, orderData);
        grossAmount = order.gross_amount;
        break;

      default:
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid order type'
        });
    }

    // Calculate commission (backend-only)
    const commissionData = await calculateCommission(
      order_type,
      grossAmount,
      order.provider_id,
      order.providerModel
    );

    // Update order with commission
    order.commission_rate = commissionData.commission_rate;
    order.commission_amount = commissionData.commission_amount;
    order.provider_payout = commissionData.provider_payout;
    await order.save();

    // Log commission calculation
    await logCommissionCalculated(order._id, req.user._id, {
      commission_rate: commissionData.commission_rate,
      commission_amount: commissionData.commission_amount,
      gross_amount: grossAmount,
      provider_payout: commissionData.provider_payout
    });

    // Log order creation
    await logOrderCreated(order._id, req.user._id, {
      order_type: order.order_type,
      gross_amount: grossAmount
    });

    // Emit real-time update
    if (req.io) {
      req.io.emit('order:created', order);
    }

    // Create notification for user
    try {
      await createNotification({
        userId: req.user._id,
        title: 'Order Created',
        message: `Your ${order.order_type} order has been created successfully. Order #${order.orderNumber || order._id}`,
        category: 'orders',
        type: 'success',
        priority: 'medium',
        actionUrl: `/orders/${order._id}`,
        relatedId: order._id,
        relatedType: 'order',
        metadata: {
          orderType: order.order_type,
          orderNumber: order.orderNumber,
          amount: grossAmount
        }
      });

      // Notify seller for marketplace orders
      if (order.order_type === 'marketplace' && order.provider_id) {
        await createNotification({
          userId: order.provider_id,
          title: 'New Order Received',
          message: `You have received a new marketplace order. Order #${order.orderNumber || order._id}`,
          category: 'products',
          type: 'info',
          priority: 'high',
          actionUrl: `/orders/${order._id}`,
          relatedId: order._id,
          relatedType: 'order',
          metadata: {
            orderType: order.order_type,
            orderNumber: order.orderNumber,
            amount: grossAmount,
            itemCount: order.items?.length || 0
          }
        });
      }
    } catch (notifError) {
      console.error('Error creating order notification', notifError);
      // Don't fail order creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message || 'Error creating order'
    });
  }
};

/**
 * Create delivery order
 */
async function createDeliveryOrder(userId, data) {
  const { pickupLocation, dropoffLocation, packageDetails, driverId } = data;

  if (!pickupLocation || !dropoffLocation || !packageDetails) {
    throw new Error('Pickup location, dropoff location, and package details are required');
  }

  // Calculate distance
  const distance = calculateDistance(
    pickupLocation.latitude,
    pickupLocation.longitude,
    dropoffLocation.latitude,
    dropoffLocation.longitude
  );

  // Calculate estimated time
  const estimatedTime = calculateEstimatedTime(distance);

  // Calculate price
  const price = calculatePrice(distance, packageDetails.weight);

  // Determine provider
  let providerId = data.provider_id || null;
  let providerModel = data.providerModel || null;
  
  // If provider_id is provided but no providerModel, check if it's a logistics company
  if (providerId && !providerModel) {
    const LogisticsCompany = require('../models/LogisticsCompany.model');
    const company = await LogisticsCompany.findById(providerId);
    if (company) {
      providerModel = 'LogisticsCompany';
    }
  }
  
  // If driverId is provided, use driver as provider (takes precedence)
  if (driverId) {
    const driver = await Driver.findById(driverId);
    if (driver) {
      providerId = driver._id;
      providerModel = 'Driver';
    }
  }

  const order = await Order.create({
    order_type: 'delivery',
    userId,
    provider_id: providerId,
    providerModel,
    gross_amount: price,
    status: driverId ? 'provider_assigned' : 'created',
    pickupLocation,
    dropoffLocation,
    packageDetails,
    driverId,
    distance,
    estimatedDeliveryTime: estimatedTime,
    assignedAt: driverId ? new Date() : null
  });

  return order;
}

/**
 * Create marketplace order
 */
async function createMarketplaceOrder(userId, data, req) {
  const { deliveryOption, deliveryAddress, notes } = data;

  // Get user's cart
  const cart = await Cart.findOne({ userId })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Validate all items are still available
  const orderItems = [];
  let subtotal = 0;
  let sellerId = null;

  for (const cartItem of cart.items) {
    const product = cartItem.productId;
    if (!product || !product.isActive) {
      throw new Error(`Product ${product?.name || 'Unknown'} is no longer available`);
    }

    if (product.stock < cartItem.quantity) {
      throw new Error(`Only ${product.stock} items available for ${product.name}`);
    }

    // Get seller ID from first product (assuming all products from same seller)
    if (!sellerId && product.sellerId) {
      sellerId = product.sellerId;
    }

    const itemSubtotal = cartItem.priceAtTime * cartItem.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      productId: product._id,
      productName: product.name,
      productImage: product.images?.[0] || null,
      quantity: cartItem.quantity,
      priceAtTime: cartItem.priceAtTime,
      subtotal: itemSubtotal
    });
  }

  // Check free delivery setting
  const freeDeliverySetting = await Settings.findOne({ key: 'freeDeliveryEnabled' });
  const isFreeDelivery = freeDeliverySetting?.value === true;

  // Calculate delivery fee
  let deliveryFee = 0;
  if (deliveryOption === 'required' || deliveryOption === 'optional') {
    if (deliveryAddress) {
      const defaultPickupLocation = {
        address: 'ShipLink Warehouse',
        latitude: 40.7128,
        longitude: -74.0060
      };
      deliveryFee = await calculateDeliveryFee(
        defaultPickupLocation,
        deliveryAddress,
        isFreeDelivery
      );
    }
  }

  const total = subtotal + deliveryFee;

  // Create order
  const order = await Order.create({
    order_type: 'marketplace',
    userId,
    provider_id: sellerId,
    providerModel: sellerId ? 'Seller' : null,
    gross_amount: total,
    status: 'created',
    items: orderItems,
    subtotal,
    deliveryFee,
    isFreeDelivery,
    deliveryOption: deliveryOption || 'none',
    deliveryAddress: deliveryAddress || null,
    sellerId,
    customerInfo: {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone
    },
    notes: notes || null
  });

  // Update product stock
  for (const cartItem of cart.items) {
    const product = cartItem.productId;
    product.stock -= cartItem.quantity;
    await product.save();

    // Emit real-time stock update
    if (req.io) {
      req.io.emit('product:stock-updated', {
        productId: product._id.toString(),
        stock: product.stock
      });
    }
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Emit real-time updates
  if (req.io) {
    req.io.emit('cart:updated', { userId: userId.toString() });
  }

  return order;
}

/**
 * Create sourcing order
 */
async function createSourcingOrder(userId, data) {
  const { sourcingAgentId, sourcingDetails, requirements, amount } = data;

  if (!sourcingAgentId || !amount) {
    throw new Error('Sourcing agent ID and amount are required');
  }

  const order = await Order.create({
    order_type: 'sourcing',
    userId,
    provider_id: sourcingAgentId,
    providerModel: 'SourcingAgent',
    gross_amount: amount,
    status: 'created',
    sourcingAgentId,
    sourcingDetails: sourcingDetails || {},
    requirements: requirements || null
  });

  return order;
}

/**
 * Create coaching order
 */
async function createCoachingOrder(userId, data) {
  const { importCoachId, coachingType, sessionDetails, amount } = data;

  if (!importCoachId || !amount) {
    throw new Error('Import coach ID and amount are required');
  }

  const order = await Order.create({
    order_type: 'coaching',
    userId,
    provider_id: importCoachId,
    providerModel: 'ImportCoach',
    gross_amount: amount,
    status: 'created',
    importCoachId,
    coachingType: coachingType || 'consultation',
    sessionDetails: sessionDetails || {}
  });

  return order;
}

/**
 * Get orders (supports filtering by type and status)
 * Returns orders where user is either the customer (userId) or the provider (provider_id)
 */
exports.getOrders = async (req, res) => {
  try {
    const { order_type, status, page = 1, limit = 20, role } = req.query;

    // Build query: user can see orders where they are customer OR provider
    const query = {
      $or: [
        { userId: req.user._id },
        { provider_id: req.user._id }
      ],
      softDelete: false
    };

    if (order_type) {
      query.order_type = order_type;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('provider_id')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching orders'
    });
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('provider_id')
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is the provider
    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const isProvider = order.provider_id && order.provider_id._id?.toString() === req.user._id.toString();

    if (!isOwner && !isProvider) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this order'
      });
    }

    res.json({
      success: true,
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
 * Update order status (with state machine validation)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Check permissions
    const isOwner = order.userId.toString() === req.user._id.toString();
    const providerIdStr = order.provider_id ? (order.provider_id._id ? order.provider_id._id.toString() : order.provider_id.toString()) : null;
    const isProvider = providerIdStr && providerIdStr === req.user._id.toString();

    // Validate state transition
    if (!order.canTransitionTo(status)) {
      return res.status(400).json({
        error: 'Invalid State Transition',
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }

    // Perform transition
    const oldStatus = order.status;
    order.transitionTo(status, req.user._id, reason);

    // Handle status-specific logic
    if (status === 'completed') {
      order.actualDeliveryTime = new Date();
      
      // Recalculate commission if needed (should be immutable, but validate)
      if (canModifyCommission(order)) {
        const commissionData = await calculateCommission(
          order.order_type,
          order.gross_amount,
          order.provider_id,
          order.providerModel
        );
        order.commission_rate = commissionData.commission_rate;
        order.commission_amount = commissionData.commission_amount;
        order.provider_payout = commissionData.provider_payout;
      }

      await logOrderCompleted(order._id, req.user._id, {
        gross_amount: order.gross_amount,
        commission_amount: order.commission_amount,
        provider_payout: order.provider_payout
      });
    }

    if (status === 'cancelled') {
      await logOrderCancelled(order._id, req.user._id, reason);
    }

    await order.save();

    // Log status change
    await logOrderStatusChanged(order._id, req.user._id, oldStatus, status, reason);

    // Emit real-time update
    if (req.io) {
      req.io.emit('order:status-changed', {
        orderId: order._id,
        status: order.status,
        oldStatus
      });
    }

    // Create notifications for status changes
    try {
      const statusMessages = {
        'provider_assigned': 'Your order has been assigned to a provider',
        'in_progress': 'Your order is now in progress',
        'completed': 'Your order has been completed successfully',
        'cancelled': 'Your order has been cancelled'
      };

      const message = statusMessages[status] || `Your order status has been updated to ${status}`;
      const notificationType = status === 'completed' ? 'success' : status === 'cancelled' ? 'warning' : 'info';
      const priority = status === 'completed' || status === 'cancelled' ? 'high' : 'medium';

      // Notify order owner
      await createNotification({
        userId: order.userId,
        title: 'Order Status Updated',
        message: `${message}. Order #${order.orderNumber || order._id}`,
        category: 'orders',
        type: notificationType,
        priority,
        actionUrl: `/orders/${order._id}`,
        relatedId: order._id,
        relatedType: 'order',
        metadata: {
          orderType: order.order_type,
          orderNumber: order.orderNumber,
          status,
          oldStatus
        }
      });

      // Notify provider if assigned
      if (order.provider_id && (status === 'provider_assigned' || status === 'in_progress' || status === 'completed')) {
        await createNotification({
          userId: order.provider_id,
          title: 'Order Update',
          message: `Order #${order.orderNumber || order._id} status updated to ${status}`,
          category: 'orders',
          type: notificationType,
          priority,
          actionUrl: `/orders/${order._id}`,
          relatedId: order._id,
          relatedType: 'order',
          metadata: {
            orderType: order.order_type,
            orderNumber: order.orderNumber,
            status,
            oldStatus
          }
        });
      }
    } catch (notifError) {
      console.error('Error creating order status notification', notifError);
      // Don't fail status update if notification fails
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message || 'Error updating order status'
    });
  }
};

/**
 * Get user orders (backward compatibility)
 */
exports.getUserOrders = exports.getOrders;
