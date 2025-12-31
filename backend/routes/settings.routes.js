/**
 * Public Settings Routes
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Public routes
router.get('/public/:key', settingsController.getPublicSetting);

module.exports = router;

