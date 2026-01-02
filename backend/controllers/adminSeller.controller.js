/**
 * Admin Seller Controller
 * Handles seller verification and management
 */

const Seller = require('../models/Seller.model');
const User = require('../models/User.model');
const Product = require('../models/Product.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/sellers
 * @desc    Get all sellers with filters
 * @access  Private (Admin)
 */
exports.getAllSellers = async (req, res) => {
  try {
    const { search, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    let sellers = await Seller.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    if (search) {
      sellers = sellers.filter(seller => {
        const searchLower = search.toLowerCase();
        return (
          seller.businessName.toLowerCase().includes(searchLower) ||
          seller.userId?.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = sellers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedSellers = sellers.slice(startIndex, startIndex + parseInt(limit));

    await createAuditLog(req, 'view_sellers', 'sellers', null, { filters: query });

    res.json({
      sellers: paginatedSellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all sellers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching sellers'
    });
  }
};

/**
 * @route   GET /api/admin/sellers/:id
 * @desc    Get seller by ID
 * @access  Private (Admin)
 */
exports.getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate('userId', 'name email phone avatar');

    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ sellerId: seller._id });

    await createAuditLog(req, 'view_seller', 'seller', req.params.id);

    res.json({
      seller: {
        ...seller.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('Get seller by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching seller'
    });
  }
};

/**
 * @route   PATCH /api/admin/sellers/:id/approve
 * @desc    Approve seller verification
 * @access  Private (Admin)
 */
exports.approveSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found'
      });
    }

    seller.verificationStatus = 'approved';
    seller.isVerified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = req.admin._id;
    if (notes) seller.verificationNotes = notes;

    await seller.save();

    await createAuditLog(
      req,
      'approve_seller',
      'seller',
      id,
      { notes }
    );

    res.json({
      message: 'Seller approved successfully',
      seller: {
        id: seller._id,
        verificationStatus: seller.verificationStatus,
        verifiedAt: seller.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving seller'
    });
  }
};

/**
 * @route   PATCH /api/admin/sellers/:id/reject
 * @desc    Reject seller verification
 * @access  Private (Admin)
 */
exports.rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rejection notes are required'
      });
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found'
      });
    }

    seller.verificationStatus = 'rejected';
    seller.isVerified = false;
    seller.verifiedAt = new Date();
    seller.verifiedBy = req.admin._id;
    seller.verificationNotes = notes;

    await seller.save();

    await createAuditLog(
      req,
      'reject_seller',
      'seller',
      id,
      { notes }
    );

    res.json({
      message: 'Seller rejected successfully',
      seller: {
        id: seller._id,
        verificationStatus: seller.verificationStatus,
        verificationNotes: seller.verificationNotes
      }
    });
  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting seller'
    });
  }
};

/**
 * @route   PATCH /api/admin/sellers/:id/suspend
 * @desc    Suspend seller
 * @access  Private (Admin)
 */
exports.suspendSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const seller = await Seller.findById(id).populate('userId');
    if (!seller || !seller.userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Seller not found'
      });
    }

    seller.verificationStatus = 'suspended';
    seller.isActive = false;
    if (reason) seller.verificationNotes = reason;

    const user = seller.userId;
    user.isSuspended = true;
    user.suspensionReason = reason || 'Seller suspended by admin';

    await seller.save();
    await user.save();

    await createAuditLog(
      req,
      'suspend_seller',
      'seller',
      id,
      { reason }
    );

    res.json({
      message: 'Seller suspended successfully',
      seller: {
        id: seller._id,
        verificationStatus: seller.verificationStatus,
        isActive: seller.isActive
      }
    });
  } catch (error) {
    console.error('Suspend seller error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending seller'
    });
  }
};



