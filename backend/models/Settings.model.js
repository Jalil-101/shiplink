/**
 * Settings Model
 * App-wide settings including free delivery toggle
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  }
}, {
  timestamps: true
});

// Default settings
settingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    { key: 'freeDeliveryEnabled', value: false, description: 'Enable free delivery for all customers' },
    { key: 'freeDeliveryMessage', value: 'Free delivery on all orders!', description: 'Message shown when free delivery is enabled' },
    { key: 'deliveryBasePrice', value: 5.00, description: 'Base delivery price in local currency' },
    { key: 'deliveryPricePerKm', value: 1.50, description: 'Price per kilometer for delivery' },
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Settings', settingsSchema);




