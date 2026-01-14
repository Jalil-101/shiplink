/**
 * Logistics Invoice Controller
 * Handles invoicing for logistics companies
 */

const Invoice = require('../models/Invoice.model');
const Order = require('../models/Order.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * @route   POST /api/logistics-companies/dashboard/invoices
 * @desc    Create an invoice from an order
 * @access  Private (Logistics Company)
 */
exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId, items, tax, dueDate, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Order ID is required'
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

    // Find order
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

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId });
    if (existingInvoice) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invoice already exists for this order'
      });
    }

    // Calculate totals
    const invoiceItems = items || [{
      description: `Shipping for Order ${order.orderNumber || order.order_id}`,
      quantity: 1,
      unitPrice: order.provider_payout || order.gross_amount,
      total: order.provider_payout || order.gross_amount
    }];

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = tax || 0;
    const total = subtotal + taxAmount;

    // Create invoice
    const invoice = await Invoice.create({
      orderId,
      companyId: company._id,
      customerId: order.userId,
      items: invoiceItems,
      subtotal,
      tax: taxAmount,
      total,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      notes: notes || null
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error creating invoice'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/invoices
 * @desc    Get all invoices for the company
 * @access  Private (Logistics Company)
 */
exports.getInvoices = async (req, res) => {
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

    const invoices = await Invoice.find(query)
      .populate('orderId', 'orderNumber order_id status')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching invoices'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/invoices/:invoiceId
 * @desc    Get single invoice details
 * @access  Private (Logistics Company)
 */
exports.getInvoiceDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { invoiceId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      companyId: company._id
    })
      .populate('orderId', 'orderNumber order_id status gross_amount')
      .populate('customerId', 'name email phone');

    if (!invoice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invoice not found'
      });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice details error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching invoice details'
    });
  }
};

/**
 * @route   PATCH /api/logistics-companies/dashboard/invoices/:invoiceId/status
 * @desc    Update invoice status
 * @access  Private (Logistics Company)
 */
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { invoiceId } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid status is required'
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

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      companyId: company._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invoice not found'
      });
    }

    invoice.status = status;
    if (status === 'paid') {
      invoice.paidAt = new Date();
    }
    await invoice.save();

    res.json({
      message: 'Invoice status updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error updating invoice status'
    });
  }
};



