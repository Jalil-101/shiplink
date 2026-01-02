/**
 * Upload Routes
 * Handles file uploads
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

// All upload routes require authentication
router.use(protect);

// Upload single file
router.post('/', uploadController.uploadMiddleware, uploadController.uploadFile);

// Upload multiple files
router.post('/multiple', uploadController.uploadMultipleMiddleware, uploadController.uploadMultipleFiles);

module.exports = router;



