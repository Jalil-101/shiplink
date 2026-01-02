/**
 * Admin Notification Management Controller
 */

const Notification = require('../models/Notification.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all notifications
 * @access  Private (Admin)
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const { isActive, targetAudience, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (targetAudience) query.targetAudience = targetAudience;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    await createAuditLog(req, 'view_notifications', 'notifications', null);

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
 * @route   POST /api/admin/notifications
 * @desc    Create notification
 * @access  Private (Admin)
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, targetAudience, priority, startDate, endDate, actionUrl } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and message are required'
      });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      priority: priority || 'medium',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      actionUrl: actionUrl || null,
      createdBy: req.admin._id
    });

    await createAuditLog(
      req,
      'create_notification',
      'notifications',
      notification._id.toString(),
      { title, type, targetAudience }
    );

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating notification'
    });
  }
};

/**
 * @route   PATCH /api/admin/notifications/:id
 * @desc    Update notification
 * @access  Private (Admin)
 */
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, targetAudience, priority, isActive, startDate, endDate, actionUrl } = req.body;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }

    if (title !== undefined) notification.title = title;
    if (message !== undefined) notification.message = message;
    if (type !== undefined) notification.type = type;
    if (targetAudience !== undefined) notification.targetAudience = targetAudience;
    if (priority !== undefined) notification.priority = priority;
    if (isActive !== undefined) notification.isActive = isActive;
    if (startDate !== undefined) notification.startDate = new Date(startDate);
    if (endDate !== undefined) notification.endDate = endDate ? new Date(endDate) : null;
    if (actionUrl !== undefined) notification.actionUrl = actionUrl;

    await notification.save();

    await createAuditLog(req, 'update_notification', 'notifications', id);

    res.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating notification'
    });
  }
};

/**
 * @route   DELETE /api/admin/notifications/:id
 * @desc    Delete notification
 * @access  Private (Admin)
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(id);

    await createAuditLog(req, 'delete_notification', 'notifications', id);

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting notification'
    });
  }
};




