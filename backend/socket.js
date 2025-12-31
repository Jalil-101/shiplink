/**
 * Socket.io Setup for Real-time Updates
 */

const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Configure properly for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join user-specific room for targeted updates
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join admin room
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log('Admin joined admin room');
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // Make io available globally
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initializeSocket, getIO };

