/**
 * Public Settings Controller
 * Handles public settings requests (for mobile app)
 */

const Settings = require('../models/Settings.model');

/**
 * @route   GET /api/settings/public/:key
 * @desc    Get public setting by key (for mobile app)
 * @access  Public
 */
exports.getPublicSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    // Only allow specific public settings
    const publicSettings = ['freeDeliveryEnabled', 'freeDeliveryMessage'];
    
    if (!publicSettings.includes(key)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This setting is not publicly accessible'
      });
    }

    const setting = await Settings.findOne({ key });

    if (!setting) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Setting not found'
      });
    }

    res.json({
      key: setting.key,
      value: setting.value,
      description: setting.description
    });
  } catch (error) {
    console.error('Get public setting error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching setting'
    });
  }
};




