/**
 * Logistics Tracking Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictToLogisticsCompany } = require('../middleware/logisticsAuth');
const logisticsTrackingController = require('../controllers/logisticsTracking.controller');

// All routes require authentication and logistics company role
router.get(
  '/',
  protect,
  restrictToLogisticsCompany,
  logisticsTrackingController.getAllTrackingOrders
);

router.get(
  '/:orderId',
  protect,
  restrictToLogisticsCompany,
  logisticsTrackingController.getTrackingData
);

router.post(
  '/:orderId/update',
  protect,
  restrictToLogisticsCompany,
  logisticsTrackingController.updateTrackingLocation
);

module.exports = router;



