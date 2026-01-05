/**
 * Seller Model
 * Represents sellers who can list products in the marketplace
 */

const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'retailer', 'wholesaler', 'manufacturer', 'distributor'],
    default: 'individual'
  },
  taxId: {
    type: String,
    default: null
  },
  bankAccountNumber: {
    type: String,
    default: null
  },
  bankName: {
    type: String,
    default: null
  },
  accountHolderName: {
    type: String,
    default: null
  },
  businessLicense: {
    type: String, // URL or base64
    default: null
  },
  documents: {
    businessRegistration: [{
      type: String
    }],
    proofOfStock: [{
      type: String
    }]
  },
  description: {
    type: String,
    default: null
  },
  categories: [{
    type: String,
    enum: ['electronics', 'food-groceries', 'clothes-fashion', 'others']
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  totalSales: {
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
  commissionRate: {
    type: Number,
    default: 10, // Percentage
    min: 0,
    max: 100
  },
  payoutSchedule: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
    default: 'weekly'
  },
  contactInfo: {
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String
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
sellerSchema.index({ userId: 1 });
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ categories: 1 });
sellerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Seller', sellerSchema);



