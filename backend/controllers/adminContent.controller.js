/**
 * Admin Content Management Controller
 * Handles CMS-lite content management
 */

const AppContent = require('../models/AppContent.model');
const { createAuditLog } = require('../middleware/adminAuth');

/**
 * @route   GET /api/admin/content
 * @desc    Get all content items with filters
 * @access  Private (Admin)
 */
exports.getAllContent = async (req, res) => {
  try {
    const { type, isActive, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const content = await AppContent.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AppContent.countDocuments(query);

    await createAuditLog(req, 'view_content', 'content', null, { filters: query });

    res.json({
      content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching content'
    });
  }
};

/**
 * @route   GET /api/admin/content/:key
 * @desc    Get content by key
 * @access  Private (Admin)
 */
exports.getContentByKey = async (req, res) => {
  try {
    const content = await AppContent.findOne({ key: req.params.key })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!content) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Content not found'
      });
    }

    await createAuditLog(req, 'view_content', 'content', req.params.key);

    res.json({
      content
    });
  } catch (error) {
    console.error('Get content by key error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching content'
    });
  }
};

/**
 * @route   POST /api/admin/content
 * @desc    Create new content item
 * @access  Private (Admin)
 */
exports.createContent = async (req, res) => {
  try {
    const { key, type, title, content, metadata, isActive, priority, startDate, endDate } = req.body;

    if (!key || !type || !title || !content) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Key, type, title, and content are required'
      });
    }

    // Check if key already exists
    const existing = await AppContent.findOne({ key });
    if (existing) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Content with this key already exists'
      });
    }

    const newContent = await AppContent.create({
      key,
      type,
      title,
      content,
      metadata: metadata || {},
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: req.admin._id
    });

    await createAuditLog(
      req,
      'create_content',
      'content',
      newContent._id.toString(),
      { key, type, title }
    );

    res.status(201).json({
      message: 'Content created successfully',
      content: newContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating content'
    });
  }
};

/**
 * @route   PATCH /api/admin/content/:id
 * @desc    Update content item
 * @access  Private (Admin)
 */
exports.updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, isActive, priority, startDate, endDate } = req.body;

    const contentItem = await AppContent.findById(id);
    
    if (!contentItem) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Content not found'
      });
    }

    if (title !== undefined) contentItem.title = title;
    if (content !== undefined) contentItem.content = content;
    if (metadata !== undefined) contentItem.metadata = metadata;
    if (isActive !== undefined) contentItem.isActive = isActive;
    if (priority !== undefined) contentItem.priority = priority;
    if (startDate !== undefined) contentItem.startDate = startDate;
    if (endDate !== undefined) contentItem.endDate = endDate;
    
    contentItem.updatedBy = req.admin._id;
    
    await contentItem.save();

    await createAuditLog(
      req,
      'update_content',
      'content',
      id,
      { title, isActive, priority }
    );

    res.json({
      message: 'Content updated successfully',
      content: contentItem
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating content'
    });
  }
};

/**
 * @route   DELETE /api/admin/content/:id
 * @desc    Delete content item
 * @access  Private (Admin)
 */
exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const contentItem = await AppContent.findById(id);
    
    if (!contentItem) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Content not found'
      });
    }

    await AppContent.findByIdAndDelete(id);

    await createAuditLog(
      req,
      'delete_content',
      'content',
      id,
      { key: contentItem.key, type: contentItem.type }
    );

    res.json({
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting content'
    });
  }
};

