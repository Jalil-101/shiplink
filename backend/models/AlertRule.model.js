/**
 * Alert Rule Model
 * Stores customizable alert rules for logistics companies
 */

const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogisticsCompany',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  trigger: {
    type: String,
    enum: ['status_change', 'delay', 'exception', 'eta_update', 'payment_received', 'custom'],
    required: true
  },
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
    // Examples:
    // - status: 'in_progress'
    // - delayHours: 2
    // - exceptionType: 'route_deviation'
  },
  actions: {
    channels: [{
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'in_app'],
      required: true
    }],
    recipients: [{
      type: String, // email addresses or phone numbers
      required: true
    }],
    template: {
      type: String,
      default: null // Custom message template
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastTriggered: {
    type: Date,
    default: null
  },
  triggerCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
alertRuleSchema.index({ companyId: 1, isActive: 1 });
alertRuleSchema.index({ trigger: 1, isActive: 1 });

module.exports = mongoose.model('AlertRule', alertRuleSchema);




