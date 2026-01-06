/**
 * Admin Notification Controller
 * Handles admin-specific notifications (system-wide announcements and admin alerts)
 */

const Notification = require('../models/Notification.model');
const UserNotification = require('../models/UserNotification.model');
const { getBadgeCounts, markAsRead, markAllAsRead, deleteNotification } = require('../utils/notificationService');
const { createAuditLog } = require('../middleware/adminAuth');

// ==================== System-Wide Notification Management ====================

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all system notifications
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
 * @desc    Create system notification
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
 * @desc    Update system notification
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
 * @desc    Delete system notification
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

// ==================== Admin Personal Notifications ====================

/**
 * @route   GET /api/admin/notifications
 * @desc    Get admin's notifications (system announcements + personal notifications)
 * @access  Private (Admin)
 */
exports.getAdminNotifications = async (req, res) => {
  try {
    const { category, read, page = 1, limit = 20 } = req.query;
    const adminId = req.admin._id;

    // Get system-wide notifications
    const systemQuery = { isActive: true };
    if (category && category === 'admin') {
      systemQuery.targetAudience = 'admins';
    }

    const systemNotifications = await Notification.find(systemQuery)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5); // Show recent system notifications

    // Get personal admin notifications
    const personalQuery = { userId: adminId };
    if (category) personalQuery.category = category;
    if (read !== undefined) personalQuery.read = read === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const personalNotifications = await UserNotification.find(personalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserNotification.countDocuments(personalQuery);

    // Combine and format notifications
    const notifications = [
      ...systemNotifications.map(n => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        category: 'admin',
        priority: n.priority,
        read: false, // System notifications are always "unread" for display
        actionUrl: n.actionUrl,
        createdAt: n.createdAt,
        isSystemNotification: true,
      })),
      ...personalNotifications.map(n => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        priority: n.priority,
        read: n.read,
        readAt: n.readAt,
        actionUrl: n.actionUrl,
        relatedId: n.relatedId,
        relatedType: n.relatedType,
        createdAt: n.createdAt,
        isSystemNotification: false,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    await createAuditLog(req, 'view_notifications', 'notifications', null);

    res.json({
      notifications: notifications.slice(0, parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total + systemNotifications.length,
        pages: Math.ceil((total + systemNotifications.length) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching notifications'
    });
  }
};

/**
 * @route   GET /api/admin/notifications/badges
 * @desc    Get admin badge counts by category
 * @access  Private (Admin)
 */
exports.getAdminBadgeCounts = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    // Get personal notification counts
    const personalCounts = await getBadgeCounts(adminId);
    
    // Get system notification count (active announcements)
    const systemCount = await Notification.countDocuments({
      isActive: true,
      targetAudience: { $in: ['all', 'admins'] },
      startDate: { $lte: new Date() },
      $or: [
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    });

    const counts = {
      ...personalCounts,
      admin: personalCounts.admin + systemCount,
      total: personalCounts.total + systemCount,
    };

    res.json(counts);
  } catch (error) {
    console.error('Get admin badge counts error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching badge counts'
    });
  }
};

/**
 * @route   PATCH /api/admin/notifications/:id/read
 * @desc    Mark admin notification as read
 * @access  Private (Admin)
 */
exports.markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    // Check if it's a system notification (can't mark as read, but we can track views)
    const systemNotification = await Notification.findById(id);
    if (systemNotification) {
      // System notifications are always active, just return success
      return res.json({
        message: 'Notification viewed',
        notification: {
          _id: systemNotification._id,
          read: false, // System notifications stay "unread" for all admins
        }
      });
    }

    // It's a personal notification
    const notification = await markAsRead(id, adminId);

    await createAuditLog(req, 'mark_notification_read', 'notifications', id);

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark admin notification as read error:', error);
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
 * @route   PATCH /api/admin/notifications/read-all
 * @desc    Mark all admin notifications as read
 * @access  Private (Admin)
 */
exports.markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    const { category } = req.query;
    const adminId = req.admin._id;

    const result = await markAllAsRead(adminId, category || null);

    await createAuditLog(req, 'mark_all_notifications_read', 'notifications', null, { category });

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all admin notifications as read error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error marking notifications as read'
    });
  }
};

/**
 * @route   DELETE /api/admin/notifications/:id
 * @desc    Delete admin notification
 * @access  Private (Admin)
 */
exports.deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    // Can't delete system notifications
    const systemNotification = await Notification.findById(id);
    if (systemNotification) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete system notifications'
      });
    }

    await deleteNotification(id, adminId);

    await createAuditLog(req, 'delete_notification', 'notifications', id);

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin notification error:', error);
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
