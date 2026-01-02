/**
 * Admin Import Coach Controller
 * Handles import coach verification and management
 */

const ImportCoach = require('../models/ImportCoach.model');
const User = require('../models/User.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/import-coaches
 * @desc    Get all import coaches with filters
 * @access  Private (Admin)
 */
exports.getAllCoaches = async (req, res) => {
  try {
    const { search, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    let coaches = await ImportCoach.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    if (search) {
      coaches = coaches.filter(coach => {
        const searchLower = search.toLowerCase();
        return (
          coach.coachName.toLowerCase().includes(searchLower) ||
          coach.userId?.email.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = coaches.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCoaches = coaches.slice(startIndex, startIndex + parseInt(limit));

    await createAuditLog(req, 'view_import_coaches', 'import_coaches', null, { filters: query });

    res.json({
      coaches: paginatedCoaches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get all import coaches error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching import coaches'
    });
  }
};

/**
 * @route   GET /api/admin/import-coaches/:id
 * @desc    Get import coach by ID
 * @access  Private (Admin)
 */
exports.getCoachById = async (req, res) => {
  try {
    const coach = await ImportCoach.findById(req.params.id)
      .populate('userId', 'name email phone avatar');

    if (!coach) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Import coach not found'
      });
    }

    await createAuditLog(req, 'view_import_coach', 'import_coach', req.params.id);

    res.json({ coach });
  } catch (error) {
    console.error('Get import coach by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching import coach'
    });
  }
};

/**
 * @route   PATCH /api/admin/import-coaches/:id/approve
 * @desc    Approve import coach verification
 * @access  Private (Admin)
 */
exports.approveCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const coach = await ImportCoach.findById(id);
    if (!coach) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Import coach not found'
      });
    }

    coach.verificationStatus = 'approved';
    coach.isVerified = true;
    coach.verifiedAt = new Date();
    coach.verifiedBy = req.admin._id;
    if (notes) coach.verificationNotes = notes;

    await coach.save();

    await createAuditLog(
      req,
      'approve_import_coach',
      'import_coach',
      id,
      { notes }
    );

    res.json({
      message: 'Import coach approved successfully',
      coach: {
        id: coach._id,
        verificationStatus: coach.verificationStatus,
        verifiedAt: coach.verifiedAt
      }
    });
  } catch (error) {
    console.error('Approve import coach error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving import coach'
    });
  }
};

/**
 * @route   PATCH /api/admin/import-coaches/:id/reject
 * @desc    Reject import coach verification
 * @access  Private (Admin)
 */
exports.rejectCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rejection notes are required'
      });
    }

    const coach = await ImportCoach.findById(id);
    if (!coach) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Import coach not found'
      });
    }

    coach.verificationStatus = 'rejected';
    coach.isVerified = false;
    coach.verifiedAt = new Date();
    coach.verifiedBy = req.admin._id;
    coach.verificationNotes = notes;

    await coach.save();

    await createAuditLog(
      req,
      'reject_import_coach',
      'import_coach',
      id,
      { notes }
    );

    res.json({
      message: 'Import coach rejected successfully',
      coach: {
        id: coach._id,
        verificationStatus: coach.verificationStatus,
        verificationNotes: coach.verificationNotes
      }
    });
  } catch (error) {
    console.error('Reject import coach error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting import coach'
    });
  }
};

/**
 * @route   PATCH /api/admin/import-coaches/:id/suspend
 * @desc    Suspend import coach
 * @access  Private (Admin)
 */
exports.suspendCoach = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const coach = await ImportCoach.findById(id).populate('userId');
    if (!coach || !coach.userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Import coach not found'
      });
    }

    coach.verificationStatus = 'suspended';
    coach.isActive = false;
    if (reason) coach.verificationNotes = reason;

    const user = coach.userId;
    user.isSuspended = true;
    user.suspensionReason = reason || 'Import coach suspended by admin';

    await coach.save();
    await user.save();

    await createAuditLog(
      req,
      'suspend_import_coach',
      'import_coach',
      id,
      { reason }
    );

    res.json({
      message: 'Import coach suspended successfully',
      coach: {
        id: coach._id,
        verificationStatus: coach.verificationStatus,
        isActive: coach.isActive
      }
    });
  } catch (error) {
    console.error('Suspend import coach error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending import coach'
    });
  }
};



