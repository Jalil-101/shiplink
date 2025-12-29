/**
 * Delivery Request Routes
 */

const express = require('express');
const { body } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createDeliveryRequest,
  getDeliveryRequests,
  getPendingRequests,
  getDeliveryRequestById,
  getMyRequests,
  getMyDeliveries,
  acceptDeliveryRequest,
  assignDriver,
  updateDeliveryStatus,
  updateDeliveryRequest,
  cancelDeliveryRequest
} = require('../controllers/deliveryRequest.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createDeliveryValidation = [
  body('pickupLocation.address')
    .trim()
    .notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.latitude')
    .notEmpty().withMessage('Pickup latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('pickupLocation.longitude')
    .notEmpty().withMessage('Pickup longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('dropoffLocation.address')
    .trim()
    .notEmpty().withMessage('Dropoff address is required'),
  body('dropoffLocation.latitude')
    .notEmpty().withMessage('Dropoff latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('dropoffLocation.longitude')
    .notEmpty().withMessage('Dropoff longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('packageDetails.weight')
    .notEmpty().withMessage('Package weight is required')
    .isFloat({ min: 0.1 }).withMessage('Weight must be greater than 0'),
  body('packageDetails.contentDescription')
    .trim()
    .notEmpty().withMessage('Content description is required')
    .isLength({ min: 3 }).withMessage('Description must be at least 3 characters')
];

const statusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
];

// Routes
router.post('/', restrictTo('user'), createDeliveryValidation, createDeliveryRequest);
router.get('/', getDeliveryRequests);
router.get('/pending', getPendingRequests);
router.get('/user/my-requests', restrictTo('user'), getMyRequests);
router.get('/driver/my-requests', restrictTo('driver'), getMyDeliveries);
router.get('/:id', getDeliveryRequestById);
router.post('/:id/accept', restrictTo('driver'), acceptDeliveryRequest);
router.post('/:id/assign', assignDriver);
router.patch('/:id/status', statusValidation, updateDeliveryStatus);
router.put('/:id', restrictTo('user'), updateDeliveryRequest);
router.delete('/:id', restrictTo('user'), cancelDeliveryRequest);

module.exports = router;

