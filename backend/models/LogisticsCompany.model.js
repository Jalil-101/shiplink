/**
 * Logistics Company Model
 * Represents logistics companies that coordinate bulk deliveries and manage multiple drivers
 */

const mongoose = require('mongoose');

const logisticsCompanySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  businessLicense: {
    type: String, // URL or base64
    default: null
  },
  description: {
    type: String,
    default: null
  },
  services: [{
    type: String,
    enum: ['local-delivery', 'international-shipping', 'warehousing', 'customs-clearance', 'express-delivery', 'bulk-shipping']
  }],
  coverageAreas: [{
    country: String,
    cities: [String]
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalShipments: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  drivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  }],
  contactInfo: {
    phone: String,
    email: String,
    website: String,
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String
    }
  },
  pricing: {
    baseRate: {
      type: Number,
      default: 0
    },
    perKmRate: {
      type: Number,
      default: 0
    },
    perKgRate: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
logisticsCompanySchema.index({ userId: 1 });
logisticsCompanySchema.index({ verificationStatus: 1 });
logisticsCompanySchema.index({ isActive: 1 });

module.exports = mongoose.model('LogisticsCompany', logisticsCompanySchema);



