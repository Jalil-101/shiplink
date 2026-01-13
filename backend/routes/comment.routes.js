/**
 * Comment Routes
 * Product comment endpoints
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :productId from parent route
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', commentController.getComments);

// Protected routes
router.post('/', protect, commentController.createComment);
router.patch('/:commentId', protect, commentController.updateComment);
router.delete('/:commentId', protect, commentController.deleteComment);
router.post('/:commentId/reply', protect, commentController.replyToComment);

module.exports = router;

