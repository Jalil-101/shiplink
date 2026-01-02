/**
 * Sourcing Agent Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const sourcingAgentController = require('../controllers/sourcingAgent.controller');

// Public routes
router.get('/', sourcingAgentController.getAllAgents);

// Protected routes (sourcing-agent role)
router.post('/create-profile', protect, sourcingAgentController.createProfile);
router.get('/profile', protect, sourcingAgentController.getProfile);
router.patch('/profile', protect, sourcingAgentController.updateProfile);

module.exports = router;



