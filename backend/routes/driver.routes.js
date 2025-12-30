/**
 * Driver Routes
 */

const express = require('express');
const { body } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createDriverProfile,
  getDrivers,
  getNearbyDrivers,
  getDriverById,
  getMyDriverProfile,
  getDriverStats,
  updateDriverLocation,
  toggleDriverAvailability,
  updateDriver,
  deleteDriver
} = require('../controllers/driver.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createDriverValidation = [
  body('licenseNumber')
    .trim()
    .notEmpty().withMessage('License number is required'),
  body('vehicleType')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['car', 'truck', 'motorcycle']).withMessage('Vehicle type must be car, truck, or motorcycle'),
  body('vehicleModel')
    .trim()
    .notEmpty().withMessage('Vehicle model is required'),
  body('vehiclePlate')
    .trim()
    .notEmpty().withMessage('Vehicle plate number is required')
];

const locationValidation = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

// Routes
router.post('/', restrictTo('driver'), createDriverValidation, createDriverProfile);
router.get('/', getDrivers);
router.get('/nearby', getNearbyDrivers);
router.get('/me/profile', restrictTo('driver'), getMyDriverProfile);
router.get('/:id', getDriverById);
router.get('/:id/stats', getDriverStats);
router.patch('/:id/location', restrictTo('driver'), locationValidation, updateDriverLocation);
router.patch('/:id/availability', restrictTo('driver'), toggleDriverAvailability);
router.put('/:id', restrictTo('driver'), updateDriver);
router.delete('/:id', restrictTo('driver'), deleteDriver);

module.exports = router;




