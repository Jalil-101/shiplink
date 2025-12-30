/**
 * User Routes
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile, getAllUsers, getUserById, updateUser } = require('../controllers/user.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/me', getProfile);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;

