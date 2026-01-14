/**
 * Logistics Return Controller
 * Handles reverse logistics (returns and pickup requests)
 */

const ReturnRequest = require('../models/ReturnRequest.model');
const Order = require('../models/Order.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * @route   GET /api/logistics-companies/dashboard/returns
 * @desc    Get all return requests for the company
 * @access  Private (Logistics Company)
 */
exports.getReturns = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const query = { companyId: company._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const returns = await ReturnRequest.find(query)
      .populate('originalOrderId', 'orderNumber order_id status')
      .populate('customerId', 'name email phone')
      .populate('driverId', 'vehicleType vehicleModel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReturnRequest.countDocuments(query);

    res.json({
      returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching returns'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/returns/:returnId
 * @desc    Get single return request details
 * @access  Private (Logistics Company)
 */
exports.getReturnDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { returnId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const returnRequest = await ReturnRequest.findOne({
      _id: returnId,
      companyId: company._id
    })
      .populate('originalOrderId', 'orderNumber order_id status items')
      .populate('customerId', 'name email phone')
      .populate('driverId', 'vehicleType vehicleModel vehiclePlate');

    if (!returnRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Return request not found'
      });
    }

    res.json({ returnRequest });
  } catch (error) {
    console.error('Get return details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching return details'
    });
  }
};

/**
 * @route   PATCH /api/logistics-companies/dashboard/returns/:returnId/status
 * @desc    Update return request status
 * @access  Private (Logistics Company)
 */
exports.updateReturnStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { returnId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Status is required'
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

    const returnRequest = await ReturnRequest.findOne({
      _id: returnId,
      companyId: company._id
    });

    if (!returnRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Return request not found'
      });
    }

    returnRequest.status = status;
    if (notes) returnRequest.notes = notes;
    await returnRequest.save();

    res.json({
      message: 'Return status updated successfully',
      returnRequest
    });
  } catch (error) {
    console.error('Update return status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating return status'
    });
  }
};



