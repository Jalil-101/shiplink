/**
 * Cart Controller
 * Handles shopping cart operations
 */

const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price images stock isActive');

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Filter out inactive or out-of-stock products
    const validItems = cart.items.filter(item => {
      const product = item.productId;
      return product && product.isActive && product.stock >= item.quantity;
    });

    // Update cart if items were filtered
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({
      cart: {
        items: validItems.map(item => ({
          productId: item.productId._id,
          product: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime
        })),
        total: validItems.reduce((sum, item) => 
          sum + (item.priceAtTime * item.quantity), 0
        )
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching cart'
    });
  }
};

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID and quantity (min 1) are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found or inactive'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        error: 'Insufficient Stock',
        message: `Only ${product.stock} items available in stock`
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient Stock',
          message: `Cannot add ${quantity} more. Only ${product.stock - cart.items[existingItemIndex].quantity} available`
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        priceAtTime: product.price
      });
    }

    await cart.save();

    // Emit real-time update
    if (req.io) {
      req.io.emit('cart:updated', { userId: req.user._id.toString() });
    }

    res.json({
      message: 'Item added to cart',
      cart: {
        items: cart.items,
        total: cart.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0)
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error adding to cart'
    });
  }
};

/**
 * @route   PATCH /api/cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined || quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID and quantity (min 0) are required'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Cart not found'
      });
    }

    if (quantity === 0) {
      // Remove item
      cart.items = cart.items.filter(
        item => item.productId.toString() !== productId
      );
    } else {
      // Update quantity
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found or inactive'
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          error: 'Insufficient Stock',
          message: `Only ${product.stock} items available in stock`
        });
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].priceAtTime = product.price; // Update price
      } else {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Item not in cart'
        });
      }
    }

    await cart.save();

    // Emit real-time update
    if (req.io) {
      req.io.emit('cart:updated', { userId: req.user._id.toString() });
    }

    res.json({
      message: 'Cart updated',
      cart: {
        items: cart.items,
        total: cart.items.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0)
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating cart'
    });
  }
};

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear cart
 * @access  Private
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // Emit real-time update
    if (req.io) {
      req.io.emit('cart:updated', { userId: req.user._id.toString() });
    }

    res.json({
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error clearing cart'
    });
  }
};

