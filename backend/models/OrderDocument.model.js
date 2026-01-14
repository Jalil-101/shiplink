/**
 * Order Document Model
 * Stores documents related to orders (waybills, bills of lading, invoices, ePOD, etc.)
 */

const mongoose = require('mongoose');

const orderDocumentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['waybill', 'bill_of_lading', 'invoice', 'proof_of_delivery', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  mimeType: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByType: {
    type: String,
    enum: ['User', 'AdminUser', 'LogisticsCompany'],
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
orderDocumentSchema.index({ orderId: 1, documentType: 1 });
orderDocumentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('OrderDocument', orderDocumentSchema);



