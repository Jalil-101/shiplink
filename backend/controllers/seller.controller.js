/**
 * Seller Controller
 * Handles seller profile management and product listing
 */

const Seller = require('../models/Seller.model');
const User = require('../models/User.model');
const Product = require('../models/Product.model');

/**
 * @route   POST /api/sellers/create-profile
 * @desc    Create seller profile
 * @access  Private (seller role)
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only seller users can create this profile'
      });
    }

    const existingProfile = await Seller.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Profile already exists'
      });
    }

    const {
      businessName,
      businessType,
      taxId,
      businessLicense,
      description,
      categories,
      commissionRate,
      payoutSchedule,
      contactInfo
    } = req.body;

    const profile = await Seller.create({
      userId,
      businessName,
      businessType: businessType || 'individual',
      taxId,
      businessLicense,
      description,
      categories: categories || [],
      commissionRate: commissionRate || 10,
      payoutSchedule: payoutSchedule || 'weekly',
      contactInfo: contactInfo || {}
    });

    res.status(201).json({
      message: 'Seller profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create seller profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating profile'
    });
  }
};

/**
 * @route   GET /api/sellers/profile
 * @desc    Get current user's seller profile
 * @access  Private (seller role)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await Seller.findOne({ userId })
      .populate('userId', 'name email phone');

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ sellerId: profile._id, isActive: true });

    res.json({
      profile: {
        ...profile.toObject(),
        totalProducts: productCount
      }
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching profile'
    });
  }
};

/**
 * @route   PATCH /api/sellers/profile
 * @desc    Update seller profile
 * @access  Private (seller role)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await Seller.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }

    Object.assign(profile, req.body);
    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating profile'
    });
  }
};

/**
 * @route   GET /api/sellers/:id/products
 * @desc    Get products by seller
 * @access  Public
 */
exports.getSellerProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    
    if (!seller || !seller.isActive || seller.verificationStatus !== 'approved') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found or not verified'
      });
    }

    const products = await Product.find({
      sellerId: id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      products,
      count: products.length,
      seller: {
        businessName: seller.businessName,
        rating: seller.rating
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching products'
    });
  }
};

/**
 * @route   GET /api/sellers/products/my-products
 * @desc    Get current seller's products
 * @access  Private (seller role)
 */
exports.getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found'
      });
    }

    const products = await Product.find({ sellerId: seller._id })
      .sort({ createdAt: -1 });

    res.json({
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching products'
    });
  }
};

/**
 * @route   POST /api/sellers/products
 * @desc    Create product (seller)
 * @access  Private (seller role)
 */
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found'
      });
    }

    if (seller.verificationStatus !== 'approved') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your seller account must be approved before creating products'
      });
    }

    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      weight,
      dimensions
    } = req.body;

    const product = await Product.create({
      sellerId: seller._id,
      name,
      description,
      price,
      category,
      images: images || [],
      stock: stock || 0,
      weight,
      dimensions,
      isActive: true,
      createdBy: seller._id,
      createdByType: 'Seller'
    });

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
 * @route   PUT /api/sellers/products/:id
 * @desc    Update product (seller)
 * @access  Private (seller role)
 */
exports.updateProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own products'
      });
    }

    Object.assign(product, req.body);
    await product.save();

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
 * @route   DELETE /api/sellers/products/:id
 * @desc    Delete product (seller - soft delete)
 * @access  Private (seller role)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller profile not found'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own products'
      });
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    await product.save();

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

