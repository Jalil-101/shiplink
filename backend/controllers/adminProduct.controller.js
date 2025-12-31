/**
 * Admin Product Management Controller
 */

const Product = require('../models/Product.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/products
 * @desc    Get all products (admin view)
 * @access  Private (Admin)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, isActive, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    await createAuditLog(req, 'view_products', 'products', null, { filters: query });

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
 * @route   GET /api/admin/products/:id
 * @desc    Get product by ID
 * @access  Private (Admin)
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    await createAuditLog(req, 'view_product', 'product', req.params.id);

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
 * @route   POST /api/admin/products
 * @desc    Create new product
 * @access  Private (Admin)
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      weight,
      dimensions,
      isFeatured
    } = req.body;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, description, price, category, and stock are required'
      });
    }

    if (images && images.length > 3) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 3 images allowed per product'
      });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      images: images || [],
      stock: parseInt(stock),
      weight: weight || 0.5,
      dimensions: dimensions || { length: 10, width: 10, height: 10 },
      isFeatured: isFeatured || false,
      createdBy: req.admin._id
    });

    await createAuditLog(
      req,
      'create_product',
      'product',
      product._id.toString(),
      { name, category, price }
    );

    // Emit real-time update
    if (req.io) {
      req.io.emit('product:created', product);
      req.io.emit('product:updated', product);
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating product'
    });
  }
};

/**
 * @route   PATCH /api/admin/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      weight,
      dimensions,
      isActive,
      isFeatured
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    if (images && images.length > 3) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 3 images allowed per product'
      });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category;
    if (images !== undefined) product.images = images;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    
    product.updatedBy = req.admin._id;
    
    await product.save();

    await createAuditLog(
      req,
      'update_product',
      'product',
      id,
      { name, stock, isActive }
    );

    // Emit real-time update
    if (req.io) {
      req.io.emit('product:updated', product);
      if (product.stock === 0) {
        req.io.emit('product:out-of-stock', { productId: product._id });
      }
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating product'
    });
  }
};

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(id);

    await createAuditLog(
      req,
      'delete_product',
      'product',
      id,
      { name: product.name }
    );

    // Emit real-time update
    if (req.io) {
      req.io.emit('product:deleted', { productId: id });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting product'
    });
  }
};

