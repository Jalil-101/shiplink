/**
 * Logistics Barcode Controller
 * Handles barcode/QR code generation for logistics companies
 */

const Order = require('../models/Order.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');
const { generateOrderQRCode, generateTrackingBarcode, generateWaybillQRCode } = require('../services/barcodeService');

/**
 * @route   GET /api/logistics-companies/dashboard/orders/:orderId/barcode
 * @desc    Generate barcode/QR code for an order
 * @access  Private (Logistics Company)
 */
exports.generateOrderBarcode = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { type = 'qr' } = req.query; // 'qr' or 'barcode'

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Find order that belongs to this company
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

    const trackingUrl = `${process.env.FRONTEND_URL || 'https://shiplink.com'}/track/${order.order_id}`;

    let barcodeData;
    if (type === 'barcode') {
      barcodeData = await generateTrackingBarcode(order.orderNumber || order.order_id);
    } else {
      barcodeData = await generateOrderQRCode(order._id, order.orderNumber || order.order_id, trackingUrl);
    }

    res.json({
      barcode: barcodeData,
      orderNumber: order.orderNumber || order.order_id,
      type
    });
  } catch (error) {
    console.error('Generate barcode error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error generating barcode'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/orders/:orderId/qr
 * @desc    Generate QR code for an order (alias for barcode endpoint)
 * @access  Private (Logistics Company)
 */
exports.generateOrderQR = async (req, res) => {
  req.query.type = 'qr';
  return exports.generateOrderBarcode(req, res);
};




