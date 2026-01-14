/**
 * Logistics Quote Controller
 * Handles freight cost quotes for logistics companies
 */

const Quote = require('../models/Quote.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');
const { calculateDistance, calculatePrice, calculateEstimatedTime } = require('../utils/distance');

/**
 * @route   POST /api/logistics-companies/dashboard/quotes/calculate
 * @desc    Calculate freight cost for a quote
 * @access  Private (Logistics Company)
 */
exports.calculateQuote = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { origin, destination, packageDetails, serviceType } = req.body;

    if (!origin || !destination || !packageDetails) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Origin, destination, and package details are required'
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

    // Calculate distance
    const distance = await calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    // Calculate price based on distance, weight, and service type
    const calculatedCost = calculatePrice(distance, packageDetails.weight, serviceType || 'standard');
    
    // Calculate estimated delivery time
    const estimatedTime = calculateEstimatedTime(distance, serviceType || 'standard');

    res.json({
      distance: distance.toFixed(2),
      calculatedCost: calculatedCost.toFixed(2),
      estimatedDeliveryTime: estimatedTime,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Calculate quote error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error calculating quote'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/quotes
 * @desc    Create a quote
 * @access  Private (Logistics Company)
 */
exports.createQuote = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { customerId, origin, destination, packageDetails, serviceType, validityEnd, notes } = req.body;

    if (!customerId || !origin || !destination || !packageDetails) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Customer ID, origin, destination, and package details are required'
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

    // Calculate quote
    const distance = await calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    const calculatedCost = calculatePrice(distance, packageDetails.weight, serviceType || 'standard');
    const estimatedTime = calculateEstimatedTime(distance, serviceType || 'standard');

    // Create quote
    const quote = await Quote.create({
      companyId: company._id,
      customerId,
      origin,
      destination,
      packageDetails,
      serviceType: serviceType || 'standard',
      calculatedCost,
      distance,
      estimatedDeliveryTime: estimatedTime,
      validityPeriod: {
        start: new Date(),
        end: validityEnd ? new Date(validityEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      },
      notes: notes || null
    });

    res.status(201).json({
      message: 'Quote created successfully',
      quote
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating quote'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/quotes
 * @desc    Get all quotes for the company
 * @access  Private (Logistics Company)
 */
exports.getQuotes = async (req, res) => {
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

    const quotes = await Quote.find(query)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quote.countDocuments(query);

    res.json({
      quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching quotes'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/quotes/:quoteId
 * @desc    Get single quote details
 * @access  Private (Logistics Company)
 */
exports.getQuoteDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { quoteId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const quote = await Quote.findOne({
      _id: quoteId,
      companyId: company._id
    })
      .populate('customerId', 'name email phone')
      .populate('convertedToOrderId', 'orderNumber order_id status');

    if (!quote) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quote not found'
      });
    }

    res.json({ quote });
  } catch (error) {
    console.error('Get quote details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching quote details'
    });
  }
};



