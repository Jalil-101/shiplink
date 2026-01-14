/**
 * Payment Model
 * Stores payment transactions for orders
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'GHS',
    enum: ['GHS', 'USD']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mobile_money', 'card', 'bank_transfer']
  },
  paymentProvider: {
    type: String,
    enum: ['mtn', 'vodafone', 'airteltigo', null],
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  // Paystack reference
  reference: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  // Paystack access code (for redirect)
  accessCode: {
    type: String,
    default: null
  },
  // Payment status from Paystack
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'abandoned'],
    default: 'pending',
    index: true
  },
  // Paystack response data
  paystackData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Payment verification data
  verifiedAt: {
    type: Date,
    default: null
  },
  // Failure reason if payment failed
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ reference: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);




