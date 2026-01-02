/**
 * Logistics Company Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictToLogisticsCompany } = require('../middleware/logisticsAuth');
const logisticsCompanyController = require('../controllers/logisticsCompany.controller');
const logisticsDashboardController = require('../controllers/logisticsDashboard.controller');

// Public routes
router.get('/', logisticsCompanyController.getAllCompanies);

// Protected routes (logistics-company role)
router.post('/create-profile', protect, logisticsCompanyController.createProfile);
router.get('/profile', protect, logisticsCompanyController.getProfile);
router.patch('/profile', protect, logisticsCompanyController.updateProfile);

// Dashboard routes (logistics-company role only)
router.get('/dashboard/overview', protect, restrictToLogisticsCompany, logisticsDashboardController.getOverview);
router.get('/dashboard/orders', protect, restrictToLogisticsCompany, logisticsDashboardController.getOrders);
router.get('/dashboard/analytics', protect, restrictToLogisticsCompany, logisticsDashboardController.getAnalytics);
router.get('/dashboard/drivers', protect, restrictToLogisticsCompany, logisticsDashboardController.getDrivers);

module.exports = router;



