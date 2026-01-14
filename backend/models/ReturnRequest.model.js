/**
 * Return Request Model
 * Handles reverse logistics (returns and pickup requests)
 */

const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  originalOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
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
  returnType: {
    type: String,
    enum: ['return', 'pickup', 'exchange'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  returnLocation: {
    address: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: Number,
    reason: String
  }],
  status: {
    type: String,
    enum: ['requested', 'approved', 'scheduled', 'in_transit', 'received', 'processed', 'rejected', 'cancelled'],
    default: 'requested',
    index: true
  },
  scheduledPickup: {
    date: Date,
    time: String,
    notes: String
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate return number before saving
returnRequestSchema.pre('save', async function(next) {
  if (!this.returnNumber) {
    const Counter = require('./Counter.model');
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'returnNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.returnNumber = `RET-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);



