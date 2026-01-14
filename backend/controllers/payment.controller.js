/**
 * Payment Controller
 * Handles payment processing with Paystack integration
 */

const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const https = require('https');

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Validate Paystack configuration on startup
if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  WARNING: PAYSTACK_SECRET_KEY is not set. Payment functionality will not work.');
}

/**
 * Helper function to make Paystack API requests
 */
const paystackRequest = (endpoint, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.status) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'Paystack API error'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize payment with Paystack
 * @access  Private
 */
exports.initializePayment = async (req, res) => {
  try {
    // Check if Paystack is configured
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key is not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const userId = req.user._id || req.user.id;
    const { amount, currency, paymentMethod, paymentData, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Amount is required and must be greater than 0'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Payment method is required'
      });
    }

    // Validate mobile money data if payment method is mobile_money
    if (paymentMethod === 'mobile_money') {
      if (!paymentData || !paymentData.provider || !paymentData.phone) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Mobile money provider and phone number are required'
        });
      }
    }

    // Generate unique reference
    const reference = `SHIPLINK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Prepare Paystack initialization data
    const paystackData = {
      email: req.user.email,
      amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
      currency: currency || 'GHS',
      reference: reference,
      callback_url: `${process.env.FRONTEND_URL || 'https://shiplink-app.vercel.app'}/payment-callback`,
      metadata: {
        userId: userId.toString(),
        paymentMethod,
        ...paymentData,
      },
    };

    // Add mobile money channel if applicable
    if (paymentMethod === 'mobile_money') {
      const channelMap = {
        mtn: 'mtn',
        vodafone: 'vodafone',
        airteltigo: 'tigo',
      };
      paystackData.channels = [channelMap[paymentData.provider] || 'mobile_money'];
    } else if (paymentMethod === 'card') {
      paystackData.channels = ['card'];
    } else if (paymentMethod === 'bank_transfer') {
      paystackData.channels = ['bank'];
    }

    // Initialize payment with Paystack
    let paystackResponse;
    try {
      paystackResponse = await paystackRequest('/transaction/initialize', 'POST', paystackData);
    } catch (error) {
      console.error('Paystack API error:', error);
      return res.status(500).json({
        error: 'Payment Service Error',
        message: error.message || 'Failed to connect to payment service. Please try again later.'
      });
    }

    if (!paystackResponse || !paystackResponse.status) {
      console.error('Paystack initialization failed:', paystackResponse);
      return res.status(400).json({
        error: 'Payment Error',
        message: paystackResponse?.message || 'Failed to initialize payment. Please check your payment details and try again.'
      });
    }

    // Create payment record and link to order if provided
    const payment = await Payment.create({
      userId,
      orderId: orderId || null,
      amount,
      currency: currency || 'GHS',
      paymentMethod,
      paymentProvider: paymentData?.provider || null,
      phoneNumber: paymentData?.phone || null,
      reference: paystackResponse.data.reference,
      accessCode: paystackResponse.data.access_code,
      status: 'pending',
      paystackData: paystackResponse.data,
    });

    // Update order with payment reference if orderId provided
    if (orderId) {
      const Order = require('../models/Order.model');
      await Order.findByIdAndUpdate(orderId, {
        paymentReference: paystackResponse.data.reference,
        paymentMethod: paymentMethod,
      });
    }

    res.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
      accessCode: paystackResponse.data.access_code,
      orderId: orderId?.toString(),
      paymentId: payment._id.toString(),
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error initializing payment',
      details: error.message
    });
  }
};

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify payment with Paystack
 * @access  Private
 */
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Payment reference is required'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ reference, userId });

    if (!payment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payment not found'
      });
    }

    // Verify payment with Paystack
    const paystackResponse = await paystackRequest(`/transaction/verify/${reference}`, 'GET');

    if (!paystackResponse.status) {
      return res.status(400).json({
        error: 'Verification Error',
        message: paystackResponse.message || 'Failed to verify payment'
      });
    }

    const transaction = paystackResponse.data;

    // Update payment status
    payment.status = transaction.status === 'success' ? 'success' : 
                     transaction.status === 'failed' ? 'failed' : 'pending';
    payment.paystackData = transaction;
    
    if (transaction.status === 'success') {
      payment.verifiedAt = new Date();
    } else if (transaction.status === 'failed') {
      payment.failureReason = transaction.gateway_response || 'Payment failed';
    }

    await payment.save();

    // Update order payment status if order exists
    if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = payment.status === 'success' ? 'paid' : 
                              payment.status === 'failed' ? 'failed' : 'pending';
        await order.save();
      }
    }

    res.json({
      status: payment.status,
      payment: payment,
      order: payment.orderId ? await Order.findById(payment.orderId) : null,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    // Don't expose internal error details to client
    res.status(500).json({
      error: 'Server Error',
      message: 'Error verifying payment'
    });
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Paystack webhook events
 * @access  Public (verified by Paystack signature)
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!signature) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature using crypto
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', webhookSecret || PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body;

    // Handle different event types
    if (event.event === 'charge.success') {
      const transaction = event.data;

      // Find payment by reference
      const payment = await Payment.findOne({ reference: transaction.reference });

      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.verifiedAt = new Date();
        payment.paystackData = transaction;
        await payment.save();

        // Update order payment status
        if (payment.orderId) {
          const order = await Order.findById(payment.orderId);
          if (order) {
            order.paymentStatus = 'paid';
            await order.save();

            // Emit real-time update
            if (req.io) {
              req.io.emit('order:payment:success', {
                orderId: order._id.toString(),
                userId: order.userId.toString(),
              });
            }
          }
        }
      }
    } else if (event.event === 'charge.failed') {
      const transaction = event.data;

      const payment = await Payment.findOne({ reference: transaction.reference });

      if (payment && payment.status !== 'failed') {
        payment.status = 'failed';
        payment.failureReason = transaction.gateway_response || 'Payment failed';
        payment.paystackData = transaction;
        await payment.save();

        // Update order payment status
        if (payment.orderId) {
          const order = await Order.findById(payment.orderId);
          if (order) {
            order.paymentStatus = 'failed';
            await order.save();
          }
        }
      }
    }

    // Always return 200 to acknowledge webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Paystack from retrying
    // Don't expose error details in response
    res.status(200).json({ received: true });
  }
};

/**
 * @route   GET /api/payments/history
 * @desc    Get user's payment history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const payments = await Payment.find({ userId })
      .populate('orderId', 'orderNumber order_id status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching payment history',
      details: error.message
    });
  }
};

