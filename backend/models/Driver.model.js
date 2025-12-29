/**
 * Driver Model
 * Extended profile for users with driver role
 */

const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    trim: true,
    unique: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'truck', 'motorcycle'],
    required: [true, 'Vehicle type is required']
  },
  vehicleModel: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  vehiclePlate: {
    type: String,
    required: [true, 'Vehicle plate number is required'],
    trim: true,
    uppercase: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  location: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
driverSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Driver', driverSchema);


