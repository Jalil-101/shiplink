/**
 * Admin Export Controller
 * Handles CSV/PDF exports
 */

const User = require('../models/User.model');
const Driver = require('../models/Driver.model');
const DeliveryRequest = require('../models/DeliveryRequest.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/export/users
 * @desc    Export users to CSV
 * @access  Private (Admin)
 */
exports.exportUsers = async (req, res) => {
  try {
    const { role, isSuspended } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';

    const users = await User.find(query)
      .select('name email phone role isSuspended createdAt')
      .sort({ createdAt: -1 });

    // Generate CSV
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.isSuspended ? 'Suspended' : 'Active',
      new Date(user.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    await createAuditLog(req, 'export_users', 'export', null, { format: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting users'
    });
  }
};

/**
 * @route   GET /api/admin/export/drivers
 * @desc    Export drivers to CSV
 * @access  Private (Admin)
 */
exports.exportDrivers = async (req, res) => {
  try {
    const { verificationStatus } = req.query;
    
    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const drivers = await Driver.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    // Generate CSV
    const headers = ['Name', 'Email', 'Phone', 'License', 'Vehicle Type', 'Status', 'Rating', 'Deliveries', 'Created At'];
    const rows = drivers.map(driver => [
      driver.userId?.name || 'N/A',
      driver.userId?.email || 'N/A',
      driver.userId?.phone || 'N/A',
      driver.licenseNumber,
      driver.vehicleType,
      driver.verificationStatus || 'pending',
      driver.rating,
      driver.totalDeliveries,
      new Date(driver.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    await createAuditLog(req, 'export_drivers', 'export', null, { format: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=drivers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export drivers error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting drivers'
    });
  }
};

/**
 * @route   GET /api/admin/export/deliveries
 * @desc    Export deliveries to CSV
 * @access  Private (Admin)
 */
exports.exportDeliveries = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const deliveries = await DeliveryRequest.find(query)
      .populate('userId', 'name email')
      .populate('driverId', 'userId')
      .populate('driverId.userId', 'name')
      .sort({ createdAt: -1 });

    // Generate CSV
    const headers = ['ID', 'Customer', 'Driver', 'Pickup', 'Dropoff', 'Status', 'Price', 'Distance', 'Created At'];
    const rows = deliveries.map(delivery => [
      delivery._id.toString().slice(-8),
      delivery.userId?.name || 'N/A',
      delivery.driverId?.userId?.name || 'Unassigned',
      delivery.pickupLocation?.address || 'N/A',
      delivery.dropoffLocation?.address || 'N/A',
      delivery.status,
      delivery.price || 0,
      delivery.distance || 0,
      new Date(delivery.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    await createAuditLog(req, 'export_deliveries', 'export', null, { format: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deliveries.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export deliveries error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error exporting deliveries'
    });
  }
};

