/**
 * Chat Model
 * Stores chat conversations between users and logistics companies
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    required: true
  },
  senderType: {
    type: String,
    enum: ['User', 'LogisticsCompany'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: String, // URLs to files
    default: []
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogisticsCompany',
    required: true,
    index: true
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  lastMessage: {
    type: String,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  unreadCountUser: {
    type: Number,
    default: 0
  },
  unreadCountCompany: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ orderId: 1, userId: 1, companyId: 1 });
chatSchema.index({ userId: 1, lastMessageAt: -1 });
chatSchema.index({ companyId: 1, lastMessageAt: -1 });

// Method to add a message
chatSchema.methods.addMessage = function(senderId, senderType, message, attachments = []) {
  this.messages.push({
    senderId,
    senderType,
    message,
    attachments
  });
  
  this.lastMessage = message;
  this.lastMessageAt = new Date();
  
  // Update unread counts
  if (senderType === 'User') {
    this.unreadCountCompany += 1;
  } else {
    this.unreadCountUser += 1;
  }
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(viewerType) {
  const now = new Date();
  
  this.messages.forEach(msg => {
    // Mark messages from the other party as read
    if (viewerType === 'User' && msg.senderType === 'LogisticsCompany' && !msg.read) {
      msg.read = true;
      msg.readAt = now;
      this.unreadCountUser = Math.max(0, this.unreadCountUser - 1);
    } else if (viewerType === 'LogisticsCompany' && msg.senderType === 'User' && !msg.read) {
      msg.read = true;
      msg.readAt = now;
      this.unreadCountCompany = Math.max(0, this.unreadCountCompany - 1);
    }
  });
  
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);

