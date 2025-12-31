/**
 * Admin Driver Verification Controller
 * Handles driver verification and management
 */

const Driver = require('../models/Driver.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/drivers
 * @desc    Get all drivers with verification status filter
 * @access  Private (Admin)
 */
exports.getAllDrivers = async (req, res) => {
  try {
    const { verificationStatus, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (verificationStatus) query.verificationStatus = verificationStatus;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let drivers = await Driver.find(query)
      .populate('userId', 'name email phone avatar isSuspended')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by search if provided
    if (search) {
      drivers = drivers.filter(driver => {
        const user = driver.userId;
        if (!user) return false;
        return (
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          driver.licenseNumber?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    const total = await Driver.countDocuments(query);

    await createAuditLog(req, 'view_drivers', 'drivers', null, { filters: query });

    res.json({
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching drivers'
    });
  }
};

/**
 * @route   GET /api/admin/drivers/pending
 * @desc    Get pending driver verifications
 * @access  Private (Admin)
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const drivers = await Driver.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone avatar')
      .sort({ createdAt: 1 });

    await createAuditLog(req, 'view_pending_drivers', 'drivers', null);

    res.json({
      drivers,
      count: drivers.length
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching pending verifications'
    });
  }
};

/**
 * @route   GET /api/admin/drivers/:id
 * @desc    Get driver by ID with full details
 * @access  Private (Admin)
 */
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('userId', 'name email phone avatar isSuspended lastActivity')
      .populate('verifiedBy', 'name email role');

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    await createAuditLog(req, 'view_driver', 'driver', req.params.id);

    res.json({
      driver
    });
  } catch (error) {
    console.error('Get driver by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching driver'
    });
  }
};

/**
 * @route   PATCH /api/admin/drivers/:id/approve
 * @desc    Approve driver verification
 * @access  Private (Admin)
 */
exports.approveDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    driver.verificationStatus = 'approved';
    driver.verificationNotes = notes || null;
    driver.verifiedAt = new Date();
    driver.verifiedBy = req.admin._id;
    
    await driver.save();

    await createAuditLog(
      req,
      'approve_driver',
      'driver',
      id,
      { notes, verificationStatus: 'approved' }
    );

    res.json({
      message: 'Driver approved successfully',
      driver: {
        id: driver._id,
        verificationStatus: driver.verificationStatus,
        verifiedAt: driver.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve driver error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving driver'
    });
  }
};

/**
 * @route   PATCH /api/admin/drivers/:id/reject
 * @desc    Reject driver verification
 * @access  Private (Admin)
 */
exports.rejectDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rejection notes are required'
      });
    }

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    driver.verificationStatus = 'rejected';
    driver.verificationNotes = notes;
    driver.verifiedAt = new Date();
    driver.verifiedBy = req.admin._id;
    
    await driver.save();

    await createAuditLog(
      req,
      'reject_driver',
      'driver',
      id,
      { notes, verificationStatus: 'rejected' }
    );

    res.json({
      message: 'Driver rejected successfully',
      driver: {
        id: driver._id,
        verificationStatus: driver.verificationStatus,
        verificationNotes: driver.verificationNotes,
        verifiedAt: driver.verifiedAt
      }
    });
  } catch (error) {
    console.error('Reject driver error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting driver'
    });
  }
};

/**
 * @route   PATCH /api/admin/drivers/:id/request-reupload
 * @desc    Request driver to re-upload ID document
 * @access  Private (Admin)
 */
exports.requestReupload = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Notes are required to explain what needs to be re-uploaded'
      });
    }

    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    driver.verificationStatus = 'needs-reupload';
    driver.verificationNotes = notes;
    driver.verifiedAt = new Date();
    driver.verifiedBy = req.admin._id;
    
    await driver.save();

    await createAuditLog(
      req,
      'request_reupload',
      'driver',
      id,
      { notes, verificationStatus: 'needs-reupload' }
    );

    res.json({
      message: 'Re-upload requested successfully',
      driver: {
        id: driver._id,
        verificationStatus: driver.verificationStatus,
        verificationNotes: driver.verificationNotes
      }
    });
  } catch (error) {
    console.error('Request reupload error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error requesting reupload'
    });
  }
};

/**
 * @route   PATCH /api/admin/drivers/:id/suspend
 * @desc    Suspend driver access
 * @access  Private (Admin)
 */
exports.suspendDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const driver = await Driver.findById(id).populate('userId');
    
    if (!driver || !driver.userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Suspend the associated user account
    const user = driver.userId;
    user.isSuspended = true;
    user.suspensionReason = reason || 'Driver account suspended by admin';
    user.suspendedAt = new Date();
    await user.save();

    // Also mark driver as unavailable
    driver.isAvailable = false;
    await driver.save();

    await createAuditLog(
      req,
      'suspend_driver',
      'driver',
      id,
      { reason, userId: user._id.toString() }
    );

    res.json({
      message: 'Driver suspended successfully',
      driver: {
        id: driver._id,
        isAvailable: driver.isAvailable
      },
      user: {
        id: user._id,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason
      }
    });
  } catch (error) {
    console.error('Suspend driver error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending driver'
    });
  }
};

