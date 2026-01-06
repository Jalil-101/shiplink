/**
 * Notification Service
 * Centralized service for creating and managing user notifications
 */

const UserNotification = require('../models/UserNotification.model');
const { getIO } = require('../socket');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.category - Notification category
 * @param {string} [options.type='info'] - Notification type
 * @param {string} [options.priority='medium'] - Notification priority
 * @param {string} [options.actionUrl] - URL to navigate to when clicked
 * @param {string} [options.relatedId] - Related entity ID
 * @param {string} [options.relatedType] - Related entity type
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Created notification
 */
async function createNotification({
  userId,
  title,
  message,
  category,
  type = 'info',
  priority = 'medium',
  actionUrl = null,
  relatedId = null,
  relatedType = null,
  metadata = {}
}) {
  try {
    if (!userId || !title || !message || !category) {
      throw new Error('Missing required notification fields: userId, title, message, category');
    }

    const notification = await UserNotification.create({
      userId,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      relatedId,
      relatedType,
      metadata
    });

    // Emit real-time notification via Socket.io
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', {
        notification: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          read: notification.read,
          actionUrl: notification.actionUrl,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType,
          createdAt: notification.createdAt
        }
      });

      // Emit badge count update
      const badgeCounts = await UserNotification.getUnreadCountByCategory(userId);
      io.to(`user:${userId}`).emit('notification:badge-update', badgeCounts);
    } catch (socketError) {
      console.error('[Notification] Error emitting notification socket event', socketError);
      // Don't fail notification creation if socket fails
    }

    console.log(`[Notification] Created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('[Notification] Error creating notification', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (same as createNotification)
 * @returns {Promise<Array>} Created notifications
 */
async function createNotificationsForUsers(userIds, notificationData) {
  const notifications = [];
  for (const userId of userIds) {
    try {
      const notification = await createNotification({
        ...notificationData,
        userId
      });
      notifications.push(notification);
    } catch (error) {
      console.error(`[Notification] Error creating notification for user ${userId}`, error);
      // Continue with other users even if one fails
    }
  }
  return notifications;
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security check)
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await UserNotification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();

    // Emit badge count update
    try {
      const io = getIO();
      const badgeCounts = await UserNotification.getUnreadCountByCategory(userId);
      io.to(`user:${userId}`).emit('notification:badge-update', badgeCounts);
    } catch (socketError) {
      logger.error('Error emitting badge update', socketError);
    }

    return notification;
  } catch (error) {
    console.error('[Notification] Error marking notification as read', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @param {string} [category] - Optional category filter
 * @returns {Promise<Object>} Update result
 */
async function markAllAsRead(userId, category = null) {
  try {
    const query = { userId, read: false };
    if (category) {
      query.category = category;
    }

    const result = await UserNotification.updateMany(query, {
      read: true,
      readAt: new Date()
    });

    // Emit badge count update
    try {
      const io = getIO();
      const badgeCounts = await UserNotification.getUnreadCountByCategory(userId);
      io.to(`user:${userId}`).emit('notification:badge-update', badgeCounts);
    } catch (socketError) {
      console.error('[Notification] Error emitting badge update', socketError);
    }

    return result;
  } catch (error) {
    console.error('[Notification] Error marking all notifications as read', error);
    throw error;
  }
}

/**
 * Get badge counts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Badge counts by category
 */
async function getBadgeCounts(userId) {
  try {
    return await UserNotification.getUnreadCountByCategory(userId);
  } catch (error) {
    console.error('[Notification] Error getting badge counts', error);
    throw error;
  }
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security check)
 * @returns {Promise<void>}
 */
async function deleteNotification(notificationId, userId) {
  try {
    const notification = await UserNotification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Emit badge count update
    try {
      const io = getIO();
      const badgeCounts = await UserNotification.getUnreadCountByCategory(userId);
      io.to(`user:${userId}`).emit('notification:badge-update', badgeCounts);
    } catch (socketError) {
      console.error('[Notification] Error emitting badge update', socketError);
    }
  } catch (error) {
    console.error('[Notification] Error deleting notification', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  createNotificationsForUsers,
  markAsRead,
  markAllAsRead,
  getBadgeCounts,
  deleteNotification
};

