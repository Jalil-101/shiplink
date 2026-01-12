/**
 * Logistics Document Controller
 * Handles document management for logistics companies
 */

const OrderDocument = require('../models/OrderDocument.model');
const Order = require('../models/Order.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * @route   POST /api/logistics-companies/dashboard/orders/:orderId/documents
 * @desc    Upload a document for an order
 * @access  Private (Logistics Company)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { documentType, fileName, fileUrl, fileSize, mimeType, description, metadata } = req.body;

    if (!documentType || !fileName || !fileUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'documentType, fileName, and fileUrl are required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Verify order belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Create document
    const document = await OrderDocument.create({
      orderId,
      documentType,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType: mimeType || null,
      uploadedBy: userId,
      uploadedByType: 'LogisticsCompany',
      description: description || null,
      metadata: metadata || {}
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error uploading document'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/orders/:orderId/documents
 * @desc    Get all documents for an order
 * @access  Private (Logistics Company)
 */
exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Verify order belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Get documents
    const documents = await OrderDocument.find({ orderId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching documents'
    });
  }
};

/**
 * @route   DELETE /api/logistics-companies/dashboard/orders/:orderId/documents/:docId
 * @desc    Delete a document
 * @access  Private (Logistics Company)
 */
exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId, docId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Verify order belongs to this company
    const order = await Order.findOne({
      _id: orderId,
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Find and delete document
    const document = await OrderDocument.findOneAndDelete({
      _id: docId,
      orderId,
      uploadedBy: userId,
      uploadedByType: 'LogisticsCompany'
    });

    if (!document) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found or you do not have permission to delete it'
      });
    }

    res.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error deleting document'
    });
  }
};

