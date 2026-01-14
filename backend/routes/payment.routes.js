/**
 * Payment Routes
 * Handles payment-related endpoints
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// Initialize payment
router.post('/initialize', protect, paymentController.initializePayment);

// Verify payment
router.get('/verify/:reference', protect, paymentController.verifyPayment);

// Get payment history
router.get('/history', protect, paymentController.getPaymentHistory);

// Webhook endpoint (no auth - verified by Paystack signature)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;



