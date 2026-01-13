/**
 * Product Model
 * Marketplace products managed by sellers or admins
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    enum: ['electronics', 'food-groceries', 'clothes-fashion', 'others'],
    required: [true, 'Product category is required'],
    index: true
  },
  images: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: 'Maximum 3 images allowed per product'
    },
    default: []
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  weight: {
    type: Number,
    default: 0.5, // kg, for delivery calculation
    min: 0
  },
  dimensions: {
    length: { type: Number, default: 10 }, // cm
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 }
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null // null means created by admin
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByType',
    required: true
  },
  createdByType: {
    type: String,
    enum: ['AdminUser', 'Seller'],
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'updatedByType',
    default: null
  },
  updatedByType: {
    type: String,
    enum: ['AdminUser', 'Seller'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search

// Generate SKU if not provided
productSchema.pre('save', async function(next) {
  if (!this.sku) {
    const categoryPrefix = {
      'electronics': 'ELC',
      'food-groceries': 'FDG',
      'clothes-fashion': 'CLF',
      'others': 'OTH'
    };
    const prefix = categoryPrefix[this.category] || 'OTH';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.sku = `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
  }
  next();
});

// Virtual for average rating (calculated from reviews)
productSchema.virtual('averageRating', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
  justOne: false,
  options: { match: { reported: false } }
});

// Virtual for review count
productSchema.virtual('reviewCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
  count: true,
  options: { match: { reported: false } }
});

// Method to update rating stats (can be called after reviews are added/updated)
productSchema.methods.updateRatingStats = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { productId: this._id, reported: false } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
    this.reviewCount = stats[0].reviewCount;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
};

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);


