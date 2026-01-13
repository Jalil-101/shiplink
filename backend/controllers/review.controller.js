/**
 * Review Controller
 * Handles product reviews with ratings and comments
 */

const Review = require('../models/Review.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Create or update review for a product
 * @access  Private
 */
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id || req.user.id;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    // Check if user has purchased this product (for verified purchase badge)
    const hasPurchased = await Order.findOne({
      userId,
      order_type: 'marketplace',
      status: { $in: ['completed', 'in_progress', 'provider_assigned'] },
      'items.productId': productId
    });

    // Check if review already exists (upsert)
    const existingReview = await Review.findOne({ productId, userId });

    const reviewData = {
      productId,
      userId,
      rating: parseInt(rating),
      comment: comment ? comment.trim() : '',
      verifiedPurchase: !!hasPurchased
    };

    let review;
    if (existingReview) {
      // Update existing review
      review = await Review.findByIdAndUpdate(
        existingReview._id,
        reviewData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email avatar');
    } else {
      // Create new review
      review = await Review.create(reviewData);
      review = await Review.findById(review._id).populate('userId', 'name email avatar');
    }

    // Update product rating stats (async, don't wait)
    product.updateRatingStats().catch(err => console.error('Error updating rating stats:', err));

    res.status(existingReview ? 200 : 201).json({
      message: existingReview ? 'Review updated successfully' : 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'You have already reviewed this product'
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating review'
    });
  }
};

/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Get reviews for a product (paginated)
 * @access  Public
 */
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort criteria
    let sortCriteria = {};
    if (sort === 'recent') {
      sortCriteria = { createdAt: -1 };
    } else if (sort === 'rating') {
      sortCriteria = { rating: -1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortCriteria = { helpful: -1, createdAt: -1 };
    }

    const reviews = await Review.find({ productId, reported: false })
      .populate('userId', 'name email avatar')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ productId, reported: false });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { productId, reported: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let averageRating = 0;
    let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (ratingStats.length > 0) {
      averageRating = Math.round(ratingStats[0].averageRating * 10) / 10;
      ratingStats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        averageRating,
        totalReviews: total,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching reviews'
    });
  }
};

/**
 * @route   PATCH /api/products/:productId/reviews/:reviewId
 * @desc    Update own review
 * @access  Private
 */
exports.updateReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user._id || req.user.id;
    const { rating, comment } = req.body;

    const review = await Review.findOne({ _id: reviewId, productId, userId });
    if (!review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found or you do not have permission to update it'
      });
    }

    // Validate input
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Rating must be an integer between 1 and 5'
        });
      }
      review.rating = parseInt(rating);
    }

    if (comment !== undefined) {
      if (comment.length > 1000) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Comment cannot exceed 1000 characters'
        });
      }
      review.comment = comment.trim();
    }

    await review.save();
    await review.populate('userId', 'name email avatar');

    // Update product rating stats
    const product = await Product.findById(productId);
    if (product) {
      product.updateRatingStats().catch(err => console.error('Error updating rating stats:', err));
    }

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating review'
    });
  }
};

/**
 * @route   DELETE /api/products/:productId/reviews/:reviewId
 * @desc    Delete own review
 * @access  Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user._id || req.user.id;

    const review = await Review.findOne({ _id: reviewId, productId, userId });
    if (!review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update product rating stats
    const product = await Product.findById(productId);
    if (product) {
      product.updateRatingStats().catch(err => console.error('Error updating rating stats:', err));
    }

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting review'
    });
  }
};

/**
 * @route   POST /api/products/:productId/reviews/:reviewId/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
exports.markHelpful = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user._id || req.user.id;

    const review = await Review.findOne({ _id: reviewId, productId });
    if (!review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    const alreadyHelpful = review.helpfulUsers.includes(userId);
    
    if (alreadyHelpful) {
      // Remove helpful vote
      review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId.toString());
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      // Add helpful vote
      review.helpfulUsers.push(userId);
      review.helpful = review.helpful + 1;
    }

    await review.save();
    await review.populate('userId', 'name email avatar');

    res.json({
      message: alreadyHelpful ? 'Removed helpful vote' : 'Marked as helpful',
      review
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating helpful status'
    });
  }
};

