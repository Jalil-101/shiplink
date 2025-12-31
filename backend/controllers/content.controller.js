/**
 * Public Content Controller
 * Handles public content requests (for mobile app)
 */

const AppContent = require('../models/AppContent.model');

/**
 * @route   GET /api/content
 * @desc    Get active content items (public)
 * @access  Public
 */
exports.getActiveContent = async (req, res) => {
  try {
    const { type } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      $or: [
        { startDate: null },
        { startDate: { $lte: now } }
      ],
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    };

    if (type) {
      query.type = type;
    }

    // Fix the $or issue - combine conditions properly
    const finalQuery = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    };

    if (type) {
      finalQuery.type = type;
    }

    const content = await AppContent.find(finalQuery)
      .select('key type title content metadata priority')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      content,
      count: content.length
    });
  } catch (error) {
    console.error('Get active content error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching content'
    });
  }
};

/**
 * @route   GET /api/content/:key
 * @desc    Get content by key (public)
 * @access  Public
 */
exports.getContentByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const now = new Date();

    const content = await AppContent.findOne({
      key,
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    }).select('key type title content metadata priority');

    if (!content) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Content not found or inactive'
      });
    }

    res.json({
      content
    });
  } catch (error) {
    console.error('Get content by key error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching content'
    });
  }
};

