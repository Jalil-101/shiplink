/**
 * Audit Log / Event Log Model
 * Track all admin actions and system events (orders, role switches, etc.)
 * Events are append-only and immutable
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Event type (extends beyond admin actions)
  event_type: {
    type: String,
    enum: [
      'order_created',
      'order_status_changed',
      'order_cancelled',
      'order_completed',
      'commission_calculated',
      'role_switched',
      'role_requested',
      'admin_action',
      'payment_processed',
      'dispute_created',
      'dispute_resolved'
    ],
    required: true,
    index: true
  },
  // Actor who triggered the event (user or admin)
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'actorModel',
    required: true,
    index: true
  },
  actorModel: {
    type: String,
    enum: ['User', 'AdminUser'],
    required: true
  },
  // Legacy adminId field (for backward compatibility)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null,
    index: true
  },
  // Order-related events
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  },
  // Legacy action field (for backward compatibility)
  action: {
    type: String,
    default: null,
    index: true
  },
  // Legacy resource fields (for backward compatibility)
  resource: {
    type: String,
    default: null
  },
  resourceId: {
    type: String,
    default: null
  },
  // Flexible metadata for event data
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Legacy details field (for backward compatibility)
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Prevent updates and deletes (append-only)
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function() {
  throw new Error('AuditLog entries are immutable and cannot be updated or deleted');
});

// Indexes for efficient queries
auditLogSchema.index({ event_type: 1, createdAt: -1 });
auditLogSchema.index({ order_id: 1, createdAt: -1 });
auditLogSchema.index({ actor_id: 1, createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);


