/**
 * User Notification Model
 * Individual notifications for each user (not system-wide announcements)
 */

const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
    enum: ['info', 'success', 'warning', 'error', 'announcement'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['orders', 'role_applications', 'deliveries', 'products', 'earnings', 'system', 'messages', 'admin'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedType: {
    type: String,
    enum: ['order', 'delivery', 'product', 'role_application', 'user', 'driver', 'seller', 'sourcing_agent', 'import_coach', 'logistics_company', null],
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
userNotificationSchema.index({ userId: 1, read: 1 });
userNotificationSchema.index({ userId: 1, category: 1 });
userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, category: 1, read: 1 });

// Instance method to mark as read
userNotificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count by category
userNotificationSchema.statics.getUnreadCountByCategory = async function(userId) {
  const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const counts = await this.aggregate([
    { $match: { userId: userIdObj, read: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const result = {
    orders: 0,
    role_applications: 0,
    deliveries: 0,
    products: 0,
    earnings: 0,
    system: 0,
    messages: 0,
    admin: 0,
    total: 0
  };
  
  counts.forEach(item => {
    result[item._id] = item.count;
    result.total += item.count;
  });
  
  return result;
};

// Static method to get total unread count
userNotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

module.exports = mongoose.model('UserNotification', userNotificationSchema);

