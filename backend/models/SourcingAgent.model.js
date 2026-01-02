/**
 * Sourcing Agent Model
 * Represents agents who help users source goods locally or internationally
 */

const mongoose = require('mongoose');

const sourcingAgentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  agentName: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true
  },
  specialization: [{
    type: String,
    enum: ['electronics', 'clothing', 'food-groceries', 'furniture', 'machinery', 'raw-materials', 'general']
  }],
  coverageAreas: [{
    country: String,
    cities: [String],
    regions: [String]
  }],
  languages: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  successfulRequests: {
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
    default: 5, // Percentage
    min: 0,
    max: 100
  },
  bio: {
    type: String,
    default: null
  },
  experience: {
    type: String,
    default: null
  },
  contactInfo: {
    phone: String,
    email: String,
    whatsapp: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
sourcingAgentSchema.index({ userId: 1 });
sourcingAgentSchema.index({ verificationStatus: 1 });
sourcingAgentSchema.index({ specialization: 1 });

module.exports = mongoose.model('SourcingAgent', sourcingAgentSchema);



