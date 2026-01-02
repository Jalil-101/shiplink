/**
 * Role Routes
 * Handles role switching and role requests
 */

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get available roles
router.get('/available', roleController.getAvailableRoles);

// Switch active role
router.post('/switch', roleController.switchActiveRole);

// Request new role
router.post('/request', roleController.requestRole);

module.exports = router;



