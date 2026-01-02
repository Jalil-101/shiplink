/**
 * Import Coach Model
 * Represents coaches who provide importation and customs guidance
 */

const mongoose = require('mongoose');

const importCoachSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  coachName: {
    type: String,
    required: [true, 'Coach name is required'],
    trim: true
  },
  expertise: [{
    type: String,
    enum: ['customs-clearance', 'import-documentation', 'tariff-classification', 'trade-regulations', 'duty-optimization', 'compliance', 'general-import']
  }],
  countries: [{
    type: String // ISO country codes
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
  totalSessions: {
    type: Number,
    default: 0
  },
  successfulSessions: {
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
  hourlyRate: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    default: null
  },
  qualifications: [{
    type: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date
  }],
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
importCoachSchema.index({ userId: 1 });
importCoachSchema.index({ verificationStatus: 1 });
importCoachSchema.index({ expertise: 1 });
importCoachSchema.index({ countries: 1 });

module.exports = mongoose.model('ImportCoach', importCoachSchema);



