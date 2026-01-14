/**
 * Review Routes
 * Product review endpoints
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :productId from parent route
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', reviewController.getReviews);

// Protected routes
router.post('/', protect, reviewController.createReview);
router.patch('/:reviewId', protect, reviewController.updateReview);
router.delete('/:reviewId', protect, reviewController.deleteReview);
router.post('/:reviewId/helpful', protect, reviewController.markHelpful);

module.exports = router;




