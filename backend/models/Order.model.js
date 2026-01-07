/**
 * Unified Order Model
 * Consolidates all order types: delivery, marketplace, sourcing, coaching
 * Orders are never deleted - only status changes
 */

const mongoose = require('mongoose');

// Order item schema (for marketplace orders)
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Store name at time of order
  },
  productImage: {
    type: String,
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtTime: {
    type: Number,
    required: true // Store price at time of order
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

// Status history entry
const statusHistoryEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reason: {
    type: String,
    default: null
  }
}, { _id: false });

// Valid state transitions
const VALID_TRANSITIONS = {
  'created': ['provider_assigned', 'cancelled', 'failed'],
  'provider_assigned': ['in_progress', 'cancelled', 'failed'],
  'in_progress': ['completed', 'cancelled', 'failed'],
  'completed': [], // Terminal state
  'cancelled': [], // Terminal state
  'failed': [] // Terminal state
};

const orderSchema = new mongoose.Schema({
  // Core order identification
  order_id: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  order_type: {
    type: String,
    enum: ['delivery', 'marketplace', 'sourcing', 'coaching'],
    required: true,
    index: true
  },
  
  // User and provider
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'providerModel',
    default: null,
    index: true
  },
  providerModel: {
    type: String,
    enum: ['Driver', 'Seller', 'SourcingAgent', 'ImportCoach', 'LogisticsCompany'],
    default: null
  },
  
  // Financial fields (backend-calculated only)
  gross_amount: {
    type: Number,
    required: true,
    min: 0
  },
  commission_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  commission_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  provider_payout: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status and state machine
  status: {
    type: String,
    enum: ['created', 'provider_assigned', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'created',
    required: true,
    index: true
  },
  statusHistory: {
    type: [statusHistoryEntrySchema],
    default: []
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Soft delete flag (orders never actually deleted)
  softDelete: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // ===== DELIVERY-SPECIFIC FIELDS (when order_type === 'delivery') =====
  pickupLocation: {
    address: {
      type: String,
      default: null
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      default: null
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  packageDetails: {
    weight: {
      type: Number,
      default: null,
      min: 0
    },
    dimensions: {
      length: {
        type: Number,
        default: null,
        min: 0
      },
      width: {
        type: Number,
        default: null,
        min: 0
      },
      height: {
        type: Number,
        default: null,
        min: 0
      }
    },
    contentDescription: {
      type: String,
      default: null
    }
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  estimatedDeliveryTime: {
    type: String,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  
  // ===== MARKETPLACE-SPECIFIC FIELDS (when order_type === 'marketplace') =====
  items: {
    type: [orderItemSchema],
    default: []
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  isFreeDelivery: {
    type: Boolean,
    default: false
  },
  deliveryOption: {
    type: String,
    enum: ['none', 'required', 'optional'],
    default: 'optional'
  },
  deliveryAddress: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null
  },
  
  // ===== SOURCING-SPECIFIC FIELDS (when order_type === 'sourcing') =====
  sourcingAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SourcingAgent',
    default: null
  },
  sourcingDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  requirements: {
    type: String,
    default: null
  },
  
  // ===== COACHING-SPECIFIC FIELDS (when order_type === 'coaching') =====
  importCoachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportCoach',
    default: null
  },
  coachingType: {
    type: String,
    enum: ['consultation', 'full-service', 'documentation', 'customs-clearance'],
    default: null
  },
  sessionDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // ===== COMMON FIELDS =====
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  notes: {
    type: String,
    default: null
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  disputeResolution: {
    resolved: {
      type: Boolean,
      default: false
    },
    resolution: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Initialize status history before saving
orderSchema.pre('save', async function(next) {
  // Initialize status history if empty
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      changedAt: new Date(),
      changedBy: this.userId
    }];
  }
  
  next();
});

// State machine validation
orderSchema.methods.canTransitionTo = function(newStatus) {
  const currentStatus = this.status;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

orderSchema.methods.transitionTo = function(newStatus, changedBy = null, reason = null) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Invalid state transition from ${this.status} to ${newStatus}`);
  }
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: changedBy || this.userId,
    reason: reason
  });
  
  this.status = newStatus;
  return this;
};

// Validate state transitions on save
orderSchema.pre('save', async function(next) {
  // Skip validation for new documents
  if (this.isNew) {
    return next();
  }
  
  // If status is being modified, validate transition
  if (this.isModified('status')) {
    try {
      const doc = await this.constructor.findById(this._id);
      if (doc && doc.status !== this.status) {
        if (!this.canTransitionTo(this.status)) {
          return next(new Error(`Invalid state transition from ${doc.status} to ${this.status}`));
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ provider_id: 1, status: 1 });
orderSchema.index({ order_type: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ order_id: 1 });
orderSchema.index({ softDelete: 1 });

module.exports = mongoose.model('Order', orderSchema);
