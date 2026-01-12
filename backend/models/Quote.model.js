/**
 * Quote Model
 * Stores freight cost quotes for logistics companies
 */

const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogisticsCompany',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    address: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  destination: {
    address: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  packageDetails: {
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg'
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    contentDescription: String
  },
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'economy'],
    default: 'standard'
  },
  calculatedCost: {
    type: Number,
    required: true,
    min: 0
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  estimatedDeliveryTime: {
    type: String,
    default: null
  },
  validityPeriod: {
    start: {
      type: Date,
      default: Date.now
    },
    end: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'converted'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    default: null
  },
  convertedToOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// Generate quote number before saving
quoteSchema.pre('save', async function(next) {
  if (!this.quoteNumber) {
    const Counter = require('./Counter.model');
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'quoteNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.quoteNumber = `QT-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);

