/**
 * Chat Controller
 * Handles chat functionality for users and logistics companies
 */

const Chat = require('../models/Chat.model');
const Order = require('../models/Order.model');
const User = require('../models/User.model');
const LogisticsCompany = require('../models/LogisticsCompany.model');

/**
 * @route   GET /api/chat/order/:orderId
 * @desc    Get or create chat for an order (User side)
 * @access  Private
 */
exports.getOrCreateChat = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;

    // Check if orderId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
    
    // Build query to find order by _id, order_id, or orderNumber
    const orderQuery = {
      userId,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    if (isValidObjectId) {
      orderQuery._id = orderId;
    } else {
      // If not a valid ObjectId, search by order_id or orderNumber
      orderQuery.$or = [
        { order_id: orderId },
        { orderNumber: orderId }
      ];
    }

    // Verify order belongs to user
    const order = await Order.findOne(orderQuery).populate('provider_id');

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to you'
      });
    }

    // Ensure provider_id is an ObjectId
    const companyId = order.provider_id?._id || order.provider_id;

    if (!companyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Order does not have an assigned logistics company'
      });
    }

    // Get or create chat - use order._id (MongoDB ObjectId) for chat.orderId
    const orderMongoId = order._id;
    
    let chat = await Chat.findOne({
      orderId: orderMongoId,
      userId,
      companyId
    })
      .populate('userId', 'name email')
      .populate('companyId', 'companyName logo');

    if (!chat) {
      chat = await Chat.create({
        orderId: orderMongoId,
        userId,
        companyId
      });
      chat = await Chat.findById(chat._id)
        .populate('userId', 'name email')
        .populate('companyId', 'companyName logo');
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching chat'
    });
  }
};

/**
 * @route   POST /api/chat/order/:orderId/message
 * @desc    Send a message in a chat (User side)
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { message, attachments } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required'
      });
    }

    // Check if orderId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
    
    // Build query to find order by _id, order_id, or orderNumber
    const orderQuery = {
      userId,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    if (isValidObjectId) {
      orderQuery._id = orderId;
    } else {
      // If not a valid ObjectId, search by order_id or orderNumber
      orderQuery.$or = [
        { order_id: orderId },
        { orderNumber: orderId }
      ];
    }

    // Verify order belongs to user
    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to you'
      });
    }

    // Ensure provider_id is an ObjectId
    const companyId = order.provider_id?._id || order.provider_id;

    if (!companyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Order does not have an assigned logistics company'
      });
    }

    // Get or create chat - use order._id (MongoDB ObjectId) for chat.orderId
    const orderMongoId = order._id;
    
    let chat = await Chat.findOne({
      orderId: orderMongoId,
      userId,
      companyId
    });

    if (!chat) {
      chat = await Chat.create({
        orderId: orderMongoId,
        userId,
        companyId
      });
    }

    // Add message
    await chat.addMessage(userId, 'User', message.trim(), attachments || []);

    // Reload chat with populated fields
    chat = await Chat.findById(chat._id)
      .populate('userId', 'name email')
      .populate('companyId', 'companyName logo');

    // Emit real-time message via Socket.io
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      
      // Emit to company
      io.to(`company:${companyId}`).emit('chat:message', {
        chatId: chat._id,
        orderId,
        message: chat.messages[chat.messages.length - 1]
      });
      
      // Emit to user
      io.to(`user:${userId}`).emit('chat:message', {
        chatId: chat._id,
        orderId,
        message: chat.messages[chat.messages.length - 1]
      });
    } catch (socketError) {
      console.error('Error emitting chat message:', socketError);
      // Don't fail the request if socket fails
    }

    res.json({
      message: 'Message sent successfully',
      chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending message'
    });
  }
};

/**
 * @route   PATCH /api/chat/:chatId/read
 * @desc    Mark chat messages as read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { chatId } = req.params;
    const { viewerType } = req.body; // 'User' or 'LogisticsCompany'

    const chat = await Chat.findOne({
      _id: chatId,
      $or: [
        { userId },
        { companyId: userId } // For logistics company users
      ]
    });

    if (!chat) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Chat not found'
      });
    }

    await chat.markAsRead(viewerType || 'User');

    res.json({
      message: 'Messages marked as read',
      chat
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error marking messages as read'
    });
  }
};

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all chat conversations for a user
 * @access  Private
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const chats = await Chat.find({
      userId,
      isActive: true
    })
      .populate('orderId', 'orderNumber order_id status')
      .populate('companyId', 'companyName logo')
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({ chats });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching conversations'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/chat/conversations
 * @desc    Get all chat conversations for a logistics company
 * @access  Private (Logistics Company)
 */
exports.getCompanyConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    const chats = await Chat.find({
      companyId: company._id,
      isActive: true
    })
      .populate('orderId', 'orderNumber order_id status')
      .populate('userId', 'name email phone')
      .sort({ lastMessageAt: -1 })
      .limit(100);

    res.json({ chats });
  } catch (error) {
    console.error('Get company conversations error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching conversations'
    });
  }
};

/**
 * @route   GET /api/logistics-companies/dashboard/chat/order/:orderId
 * @desc    Get chat for an order (Logistics Company side)
 * @access  Private (Logistics Company)
 */
exports.getCompanyChat = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Check if orderId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
    
    // Build query to find order by _id, order_id, or orderNumber
    const orderQuery = {
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    if (isValidObjectId) {
      orderQuery._id = orderId;
    } else {
      // If not a valid ObjectId, search by order_id or orderNumber
      orderQuery.$or = [
        { order_id: orderId },
        { orderNumber: orderId }
      ];
    }

    // Verify order belongs to company
    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Get or create chat - use order._id (MongoDB ObjectId) for chat.orderId
    const orderMongoId = order._id;
    
    let chat = await Chat.findOne({
      orderId: orderMongoId,
      userId: order.userId,
      companyId: company._id
    })
      .populate('userId', 'name email phone')
      .populate('companyId', 'companyName logo');

    if (!chat) {
      chat = await Chat.create({
        orderId: orderMongoId,
        userId: order.userId,
        companyId: company._id
      });
      chat = await Chat.findById(chat._id)
        .populate('userId', 'name email phone')
        .populate('companyId', 'companyName logo');
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get company chat error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error fetching chat'
    });
  }
};

/**
 * @route   POST /api/logistics-companies/dashboard/chat/order/:orderId/message
 * @desc    Send a message in a chat (Logistics Company side)
 * @access  Private (Logistics Company)
 */
exports.sendCompanyMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { orderId } = req.params;
    const { message, attachments } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required'
      });
    }

    // Get company profile
    const company = await LogisticsCompany.findOne({ userId });
    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Logistics company profile not found'
      });
    }

    // Check if orderId is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(orderId);
    
    // Build query to find order by _id, order_id, or orderNumber
    const orderQuery = {
      provider_id: company._id,
      providerModel: 'LogisticsCompany',
      softDelete: false
    };

    if (isValidObjectId) {
      orderQuery._id = orderId;
    } else {
      // If not a valid ObjectId, search by order_id or orderNumber
      orderQuery.$or = [
        { order_id: orderId },
        { orderNumber: orderId }
      ];
    }

    // Verify order belongs to company
    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found or does not belong to your company'
      });
    }

    // Get or create chat - use order._id (MongoDB ObjectId) for chat.orderId
    const orderMongoId = order._id;
    
    let chat = await Chat.findOne({
      orderId: orderMongoId,
      userId: order.userId,
      companyId: company._id
    });

    if (!chat) {
      chat = await Chat.create({
        orderId: orderMongoId,
        userId: order.userId,
        companyId: company._id
      });
    }

    // Add message
    await chat.addMessage(company._id, 'LogisticsCompany', message.trim(), attachments || []);

    // Reload chat with populated fields
    chat = await Chat.findById(chat._id)
      .populate('userId', 'name email phone')
      .populate('companyId', 'companyName logo');

    // Emit real-time message via Socket.io
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      const lastMessage = chat.messages[chat.messages.length - 1];
      
      // Emit to user
      io.to(`user:${order.userId}`).emit('chat:message', {
        chatId: chat._id.toString(),
        orderId: orderId.toString(),
        message: lastMessage
      });
      
      // Emit to company
      io.to(`company:${company._id.toString()}`).emit('chat:message', {
        chatId: chat._id.toString(),
        orderId: orderId.toString(),
        message: lastMessage
      });
    } catch (socketError) {
      console.error('Error emitting chat message:', socketError);
      // Don't fail the request if socket fails
    }

    res.json({
      message: 'Message sent successfully',
      chat
    });
  } catch (error) {
    console.error('Send company message error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Error sending message'
    });
  }
};

