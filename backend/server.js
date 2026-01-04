/**
 * ShipLink Backend Server
 * Entry point for the API server
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const { initializeSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const driverRoutes = require('./routes/driver.routes');
const deliveryRequestRoutes = require('./routes/deliveryRequest.routes');
const adminRoutes = require('./routes/admin.routes');
const contentRoutes = require('./routes/content.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const settingsRoutes = require('./routes/settings.routes');
const logisticsCompanyRoutes = require('./routes/logisticsCompany.routes');
const sourcingAgentRoutes = require('./routes/sourcingAgent.routes');
const importCoachRoutes = require('./routes/importCoach.routes');
const sellerRoutes = require('./routes/seller.routes');
const roleRoutes = require('./routes/role.routes');
const uploadRoutes = require('./routes/upload.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, uploadLimiter, adminLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5444;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shiplink';

// Initialize Socket.io
const io = initializeSocket(server);

// Make io available to routes via req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Check required environment variables on startup
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in environment variables!');
  console.error('   Please set JWT_SECRET in your Render environment variables.');
  console.error('   This will cause registration and login to fail.');
}

if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/shiplink') {
  console.error('❌ ERROR: MONGODB_URI is not set or using default!');
  console.error('   Please set MONGODB_URI in your Render environment variables.');
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (increased limit for image uploads)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Rate limiting - applied to all API routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ShipLink API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes); // Strict rate limiting for auth
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/delivery-requests', deliveryRequestRoutes);
app.use('/api/admin', adminLimiter, adminRoutes); // Higher rate limit for admin
app.use('/api/content', contentRoutes); // Public content endpoint
app.use('/api/products', productRoutes); // Public products
app.use('/api/cart', cartRoutes); // Cart (protected)
app.use('/api/orders', orderRoutes); // Orders (protected)
app.use('/api/settings', settingsRoutes); // Public settings
app.use('/api/logistics-companies', logisticsCompanyRoutes); // Logistics companies
app.use('/api/sourcing-agents', sourcingAgentRoutes); // Sourcing agents
app.use('/api/import-coaches', importCoachRoutes); // Import coaches
app.use('/api/sellers', sellerRoutes); // Sellers
app.use('/api/roles', roleRoutes); // Role switching and management
app.use('/api/upload', uploadLimiter, uploadRoutes); // File uploads with rate limiting

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${MONGODB_URI.split('/').pop().split('?')[0]}`);
    
    // Initialize default settings
    try {
      const Settings = require('./models/Settings.model');
      await Settings.initializeDefaults();
      console.log('✅ Default settings initialized');
    } catch (error) {
      console.error('⚠️  Warning: Failed to initialize default settings:', error.message);
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io ready for real-time updates`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌'}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;


