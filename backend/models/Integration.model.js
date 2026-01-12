/**
 * Integration Model
 * Stores integration configurations for logistics companies
 */

const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogisticsCompany',
    required: true,
    index: true
  },
  integrationType: {
    type: String,
    enum: ['erp', 'crm', 'wms', 'carrier', 'accounting'],
    required: true
  },
  provider: {
    type: String,
    required: true, // e.g., 'SAP', 'Salesforce', 'FedEx', 'QuickBooks'
    trim: true
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
    // Stores API keys, endpoints, credentials, etc.
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  syncSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    syncDirection: {
      type: String,
      enum: ['inbound', 'outbound', 'bidirectional'],
      default: 'outbound'
    },
    syncFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastSyncAt: {
      type: Date,
      default: null
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
integrationSchema.index({ companyId: 1, integrationType: 1 });
integrationSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Integration', integrationSchema);

