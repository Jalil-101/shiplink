/**
 * Notification Routes
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getBadgeCounts,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get notifications
router.get('/', getNotifications);

// Get badge counts
router.get('/badges', getBadgeCounts);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;

