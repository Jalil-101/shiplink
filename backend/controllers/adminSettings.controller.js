/**
 * Admin Settings Controller
 * Manages app-wide settings including free delivery toggle
 */

const Settings = require('../models/Settings.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/settings
 * @desc    Get all settings
 * @access  Private (Admin)
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.find().sort({ key: 1 });

    await createAuditLog(req, 'view_settings', 'settings', null);

    res.json({
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching settings'
    });
  }
};

/**
 * @route   GET /api/admin/settings/:key
 * @desc    Get setting by key
 * @access  Private (Admin)
 */
exports.getSettingByKey = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Setting not found'
      });
    }

    res.json({
      setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching setting'
    });
  }
};

/**
 * @route   PATCH /api/admin/settings/:key
 * @desc    Update setting
 * @access  Private (Admin)
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Value is required'
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        description: description || undefined,
        updatedBy: req.admin._id
      },
      { upsert: true, new: true }
    );

    await createAuditLog(
      req,
      'update_setting',
      'settings',
      key,
      { key, value }
    );

    // Emit real-time update for important settings
    if (req.io && (key === 'freeDeliveryEnabled' || key.includes('delivery'))) {
      req.io.emit('settings:updated', { key, value });
    }

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating setting'
    });
  }
};

