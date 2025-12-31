/**
 * Payout Model
 * Tracks driver payouts and financial transactions
 */

const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'cash', 'other'],
    required: true
  },
  paymentDetails: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    mobileNumber: String,
    notes: String
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  deliveries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryRequest'
  }],
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ driverId: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);

