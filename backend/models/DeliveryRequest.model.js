/**
 * Delivery Request Model
 * Represents a delivery request from a user to a driver
 */

const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Pickup latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Pickup longitude is required']
    }
  },
  dropoffLocation: {
    address: {
      type: String,
      required: [true, 'Dropoff address is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Dropoff latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Dropoff longitude is required']
    }
  },
  packageDetails: {
    weight: {
      type: Number,
      required: [true, 'Package weight is required'],
      min: [0.1, 'Weight must be greater than 0']
    },
    dimensions: {
      length: {
        type: Number,
        default: 10,
        min: 0
      },
      width: {
        type: Number,
        default: 10,
        min: 0
      },
      height: {
        type: Number,
        default: 10,
        min: 0
      }
    },
    contentDescription: {
      type: String,
      required: [true, 'Content description is required'],
      trim: true,
      minlength: [3, 'Description must be at least 3 characters']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  estimatedDeliveryTime: {
    type: String,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
deliveryRequestSchema.index({ receiverId: 1, status: 1 });
deliveryRequestSchema.index({ driverId: 1, status: 1 });
deliveryRequestSchema.index({ status: 1 });

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);





