/**
 * Public Content Routes
 * For mobile app to fetch app content
 */

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');

// Public routes (no authentication required)
router.get('/', contentController.getActiveContent);
router.get('/:key', contentController.getContentByKey);

module.exports = router;




