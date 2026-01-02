/**
 * Import Coach Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const importCoachController = require('../controllers/importCoach.controller');

// Public routes
router.get('/', importCoachController.getAllCoaches);

// Protected routes (import-coach role)
router.post('/create-profile', protect, importCoachController.createProfile);
router.get('/profile', protect, importCoachController.getProfile);
router.patch('/profile', protect, importCoachController.updateProfile);

module.exports = router;



