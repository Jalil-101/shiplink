/**
 * Product Controller (Public)
 * Handles product listing and details for users
 */

const Product = require('../models/Product.model');

/**
 * @route   GET /api/products
 * @desc    Get all active products with filters
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, featured, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .select('name description price category images stock isFeatured weight dimensions')
      .sort(featured === 'true' ? { isFeatured: -1, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching products'
    });
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('name description price category images stock isFeatured weight dimensions createdAt');

    if (!product || !product.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    res.json({
      product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching product'
    });
  }
};

/**
 * @route   GET /api/products/categories/list
 * @desc    Get product count by category
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryMap = {
      'electronics': 'Electronics',
      'food-groceries': 'Food & Groceries',
      'clothes-fashion': 'Clothes & Fashion',
      'others': 'Others'
    };

    const formatted = categories.map(cat => ({
      key: cat._id,
      name: categoryMap[cat._id] || cat._id,
      count: cat.count
    }));

    res.json({
      categories: formatted
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching categories'
    });
  }
};




