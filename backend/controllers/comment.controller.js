/**
 * Comment Controller
 * Handles product comments/questions (separate from reviews)
 */

const Comment = require('../models/Comment.model');
const Product = require('../models/Product.model');

/**
 * @route   POST /api/products/:productId/comments
 * @desc    Create comment for a product
 * @access  Private
 */
exports.createComment = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id || req.user.id;
    const { text, parentId } = req.body;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment text is required'
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment cannot exceed 500 characters'
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

    // If parentId is provided, verify it exists and belongs to the same product
    if (parentId) {
      const parentComment = await Comment.findOne({ _id: parentId, productId });
      if (!parentComment) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Parent comment not found'
        });
      }
    }

    // Sanitize input (remove HTML tags and scripts)
    const sanitizedText = text.trim().replace(/<[^>]*>/g, '');

    const comment = await Comment.create({
      productId,
      userId,
      text: sanitizedText,
      parentId: parentId || null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email avatar')
      .populate('parentId');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating comment'
    });
  }
};

/**
 * @route   GET /api/products/:productId/comments
 * @desc    Get comments for a product (paginated, with replies)
 * @access  Public
 */
exports.getComments = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments (no parentId)
    const comments = await Comment.find({ 
      productId, 
      parentId: null,
      reported: false 
    })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ 
          parentId: comment._id,
          reported: false 
        })
          .populate('userId', 'name email avatar')
          .sort({ createdAt: 1 })
          .limit(10); // Limit replies per comment

        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    const total = await Comment.countDocuments({ 
      productId, 
      parentId: null,
      reported: false 
    });

    res.json({
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching comments'
    });
  }
};

/**
 * @route   PATCH /api/products/:productId/comments/:commentId
 * @desc    Update own comment
 * @access  Private
 */
exports.updateComment = async (req, res) => {
  try {
    const { productId, commentId } = req.params;
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment text is required'
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Comment cannot exceed 500 characters'
      });
    }

    const comment = await Comment.findOne({ _id: commentId, productId, userId });
    if (!comment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Comment not found or you do not have permission to update it'
      });
    }

    // Sanitize input
    const sanitizedText = text.trim().replace(/<[^>]*>/g, '');
    comment.text = sanitizedText;
    await comment.save();
    await comment.populate('userId', 'name email avatar');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating comment'
    });
  }
};

/**
 * @route   DELETE /api/products/:productId/comments/:commentId
 * @desc    Delete own comment
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  try {
    const { productId, commentId } = req.params;
    const userId = req.user._id || req.user.id;

    const comment = await Comment.findOne({ _id: commentId, productId, userId });
    if (!comment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Comment not found or you do not have permission to delete it'
      });
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentId: commentId });
    await Comment.findByIdAndDelete(commentId);

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting comment'
    });
  }
};

/**
 * @route   POST /api/products/:productId/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Private
 */
exports.replyToComment = async (req, res) => {
  try {
    const { productId, commentId } = req.params;
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reply text is required'
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Reply cannot exceed 500 characters'
      });
    }

    // Verify parent comment exists and belongs to the product
    const parentComment = await Comment.findOne({ _id: commentId, productId });
    if (!parentComment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parent comment not found'
      });
    }

    // Sanitize input
    const sanitizedText = text.trim().replace(/<[^>]*>/g, '');

    const reply = await Comment.create({
      productId,
      userId,
      text: sanitizedText,
      parentId: commentId
    });

    const populatedReply = await Comment.findById(reply._id)
      .populate('userId', 'name email avatar')
      .populate('parentId');

    res.status(201).json({
      message: 'Reply created successfully',
      comment: populatedReply
    });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating reply'
    });
  }
};




