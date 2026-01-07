/**
 * Notification Controller
 * Handles user notification operations
 */

const UserNotification = require('../models/UserNotification.model');
const { getBadgeCounts, markAsRead, markAllAsRead, deleteNotification } = require('../utils/notificationService');
const { getIO } = require('../socket');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const { category, read, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (category) query.category = category;
    if (read !== undefined) query.read = read === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await UserNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserNotification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching notifications'
    });
  }
};

/**
 * @route   GET /api/notifications/badges
 * @desc    Get badge counts by category
 * @access  Private
 */
exports.getBadgeCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const counts = await getBadgeCounts(userId);
    res.json(counts);
  } catch (error) {
    console.error('Get badge counts error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching badge counts'
    });
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await markAsRead(id, userId);

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error marking notification as read'
    });
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { category } = req.query;
    const userId = req.user._id;

    const result = await markAllAsRead(userId, category || null);

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error marking notifications as read'
    });
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await deleteNotification(id, userId);

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting notification'
    });
  }
};


