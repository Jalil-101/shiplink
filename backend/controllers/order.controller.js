/**
 * Order Controller
 * Handles order creation and management
 */

const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const Settings = require('../models/Settings.model');
const { calculateDistance } = require('../utils/distance');
const { protect } = require('../middleware/auth');

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
    return basePrice; // Default if no locations
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
 * @route   POST /api/orders
 * @desc    Create order from cart
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { deliveryOption, deliveryAddress, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cart is empty'
      });
    }

    // Validate all items are still available
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      if (!product || !product.isActive) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Product ${product?.name || 'Unknown'} is no longer available`
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: 'Insufficient Stock',
          message: `Only ${product.stock} items available for ${product.name}`
        });
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
    let deliveryRequestId = null;

    if (deliveryOption === 'required' || deliveryOption === 'optional') {
      if (!deliveryAddress) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Delivery address is required when delivery is selected'
        });
      }

      // For now, use a default pickup location (warehouse/store location)
      // This should be configurable in settings
      const defaultPickupLocation = {
        address: 'ShipLink Warehouse',
        latitude: 40.7128, // Should be from settings
        longitude: -74.0060
      };

      deliveryFee = await calculateDeliveryFee(
        defaultPickupLocation,
        deliveryAddress,
        isFreeDelivery
      );

      // Create delivery request if delivery is selected
      if (deliveryOption === 'required' || (deliveryOption === 'optional' && deliveryAddress)) {
        const totalWeight = cart.items.reduce((sum, item) => {
          return sum + ((item.productId.weight || 0.5) * item.quantity);
        }, 0);

        const deliveryRequest = await DeliveryRequest.create({
          userId: req.user._id,
          pickupLocation: defaultPickupLocation,
          dropoffLocation: deliveryAddress,
          packageDetails: {
            weight: totalWeight,
            dimensions: { length: 10, width: 10, height: 10 },
            contentDescription: `Order: ${orderItems.map(i => i.productName).join(', ')}`
          },
          status: 'pending',
          price: deliveryFee
        });

        deliveryRequestId = deliveryRequest._id;
      }
    }

    const total = subtotal + deliveryFee;

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      isFreeDelivery,
      total,
      deliveryOption: deliveryOption || 'none',
      deliveryRequestId,
      deliveryAddress: deliveryAddress || null,
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
      req.io.emit('order:created', order);
      req.io.emit('cart:updated', { userId: req.user._id.toString() });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating order'
    });
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('deliveryRequestId', 'status driverId')
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
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching orders'
    });
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name images')
      .populate('deliveryRequestId', 'status driverId pickupLocation dropoffLocation');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this order'
      });
    }

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

