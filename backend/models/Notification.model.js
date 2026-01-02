/**
 * Notification Model
 * System-wide notifications and announcements
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'announcement'],
    default: 'info'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'drivers', 'admins'],
    default: 'all'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
notificationSchema.index({ targetAudience: 1 });

module.exports = mongoose.model('Notification', notificationSchema);




