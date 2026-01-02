/**
 * Admin Bulk Operations Controller
 * Handles bulk actions (suspend, approve, etc.)
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   POST /api/admin/bulk/users/suspend
 * @desc    Bulk suspend users
 * @access  Private (Admin - super-admin only)
 */
exports.bulkSuspendUsers = async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User IDs array is required'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          isSuspended: true,
          suspensionReason: reason || 'Bulk suspension by admin',
          suspendedAt: new Date()
        }
      }
    );

    await createAuditLog(
      req,
      'bulk_suspend_users',
      'users',
      null,
      { count: userIds.length, reason }
    );

    res.json({
      message: `${result.modifiedCount} users suspended successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk suspend users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error suspending users'
    });
  }
};

/**
 * @route   POST /api/admin/bulk/users/unsuspend
 * @desc    Bulk unsuspend users
 * @access  Private (Admin - super-admin only)
 */
exports.bulkUnsuspendUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User IDs array is required'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          isSuspended: false,
          suspensionReason: null,
          suspendedAt: null
        }
      }
    );

    await createAuditLog(
      req,
      'bulk_unsuspend_users',
      'users',
      null,
      { count: userIds.length }
    );

    res.json({
      message: `${result.modifiedCount} users unsuspended successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk unsuspend users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error unsuspending users'
    });
  }
};

/**
 * @route   POST /api/admin/bulk/drivers/approve
 * @desc    Bulk approve drivers
 * @access  Private (Admin)
 */
exports.bulkApproveDrivers = async (req, res) => {
  try {
    const { driverIds, notes } = req.body;

    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Driver IDs array is required'
      });
    }

    const result = await Driver.updateMany(
      { _id: { $in: driverIds } },
      {
        $set: {
          verificationStatus: 'approved',
          verificationNotes: notes || 'Bulk approved by admin',
          verifiedAt: new Date(),
          verifiedBy: req.admin._id
        }
      }
    );

    await createAuditLog(
      req,
      'bulk_approve_drivers',
      'drivers',
      null,
      { count: driverIds.length, notes }
    );

    res.json({
      message: `${result.modifiedCount} drivers approved successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve drivers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error approving drivers'
    });
  }
};

/**
 * @route   POST /api/admin/bulk/drivers/reject
 * @desc    Bulk reject drivers
 * @access  Private (Admin)
 */
exports.bulkRejectDrivers = async (req, res) => {
  try {
    const { driverIds, notes } = req.body;

    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Driver IDs array is required'
      });
    }

    if (!notes) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rejection notes are required'
      });
    }

    const result = await Driver.updateMany(
      { _id: { $in: driverIds } },
      {
        $set: {
          verificationStatus: 'rejected',
          verificationNotes: notes,
          verifiedAt: new Date(),
          verifiedBy: req.admin._id
        }
      }
    );

    await createAuditLog(
      req,
      'bulk_reject_drivers',
      'drivers',
      null,
      { count: driverIds.length, notes }
    );

    res.json({
      message: `${result.modifiedCount} drivers rejected successfully`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk reject drivers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error rejecting drivers'
    });
  }
};




