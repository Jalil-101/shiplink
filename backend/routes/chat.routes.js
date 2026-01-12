/**
 * Chat Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictToLogisticsCompany } = require('../middleware/logisticsAuth');
const chatController = require('../controllers/chat.controller');

// User routes
router.get('/order/:orderId', protect, chatController.getOrCreateChat);
router.post('/order/:orderId/message', protect, chatController.sendMessage);
router.get('/conversations', protect, chatController.getConversations);
router.patch('/:chatId/read', protect, chatController.markAsRead);

// Note: Logistics company chat routes are registered in logisticsCompany.routes.js
// to maintain consistent route structure

module.exports = router;

