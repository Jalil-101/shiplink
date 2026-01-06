/**
 * Admin Routes
 * All admin-related routes
 */

const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../controllers/admin.controller');
const adminUserController = require('../controllers/adminUser.controller');
const adminDriverController = require('../controllers/adminDriver.controller');
const adminDeliveryController = require('../controllers/adminDelivery.controller');
const adminContentController = require('../controllers/adminContent.controller');
const adminNotificationController = require('../controllers/adminNotification.controller');
const adminPersonalNotificationController = require('../controllers/adminNotification.controller');

// Import middleware
const { protect, restrictTo } = require('../middleware/adminAuth');

// ==================== Admin Authentication ====================
router.post('/login', adminController.login);
router.get('/me', protect, adminController.getProfile);
router.post('/logout', protect, adminController.logout);

// ==================== User Management ====================
router.get('/users', protect, adminUserController.getAllUsers);
router.get('/users/:id', protect, adminUserController.getUserById);
router.patch('/users/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminUserController.suspendUser);
router.post('/users/:id/force-logout', protect, restrictTo('super-admin', 'admin'), adminUserController.forceLogout);
router.get('/users/:id/activity', protect, adminUserController.getUserActivity);

// ==================== Driver Verification ====================
router.get('/drivers', protect, adminDriverController.getAllDrivers);
router.get('/drivers/pending', protect, adminDriverController.getPendingVerifications);
router.get('/drivers/:id', protect, adminDriverController.getDriverById);
router.patch('/drivers/:id/approve', protect, restrictTo('super-admin', 'admin', 'moderator'), adminDriverController.approveDriver);
router.patch('/drivers/:id/reject', protect, restrictTo('super-admin', 'admin', 'moderator'), adminDriverController.rejectDriver);
router.patch('/drivers/:id/request-reupload', protect, restrictTo('super-admin', 'admin', 'moderator'), adminDriverController.requestReupload);
router.patch('/drivers/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminDriverController.suspendDriver);

// ==================== Delivery Oversight ====================
router.get('/deliveries', protect, adminDeliveryController.getAllDeliveries);
router.get('/deliveries/:id', protect, adminDeliveryController.getDeliveryById);
router.patch('/deliveries/:id/reassign', protect, restrictTo('super-admin', 'admin'), adminDeliveryController.reassignDriver);
router.patch('/deliveries/:id/resolve-dispute', protect, restrictTo('super-admin', 'admin'), adminDeliveryController.resolveDispute);
router.patch('/deliveries/:id/status', protect, restrictTo('super-admin', 'admin'), adminDeliveryController.updateStatus);

// ==================== Content Management ====================
router.get('/content', protect, adminContentController.getAllContent);
router.get('/content/:key', protect, adminContentController.getContentByKey);
router.post('/content', protect, adminContentController.createContent);
router.patch('/content/:id', protect, adminContentController.updateContent);
router.delete('/content/:id', protect, restrictTo('super-admin', 'admin'), adminContentController.deleteContent);

// ==================== Analytics & Reports ====================
const adminAnalyticsController = require('../controllers/adminAnalytics.controller');
router.get('/analytics/overview', protect, adminAnalyticsController.getOverview);
router.get('/analytics/users', protect, adminAnalyticsController.getUserAnalytics);
router.get('/analytics/orders', protect, adminAnalyticsController.getOrderAnalytics);
router.get('/analytics/deliveries', protect, adminAnalyticsController.getDeliveryAnalytics); // Backward compatibility

// ==================== Financial Management ====================
const adminFinancialController = require('../controllers/adminFinancial.controller');
router.get('/financial/earnings', protect, adminFinancialController.getEarningsOverview);
router.get('/financial/drivers/:id/earnings', protect, adminFinancialController.getDriverEarnings);
router.get('/financial/payouts', protect, adminFinancialController.getAllPayouts);
router.post('/financial/payouts', protect, restrictTo('super-admin', 'admin'), adminFinancialController.createPayout);
router.patch('/financial/payouts/:id/process', protect, restrictTo('super-admin', 'admin'), adminFinancialController.processPayout);

// ==================== Bulk Operations ====================
const adminBulkController = require('../controllers/adminBulk.controller');
router.post('/bulk/users/suspend', protect, restrictTo('super-admin', 'admin'), adminBulkController.bulkSuspendUsers);
router.post('/bulk/users/unsuspend', protect, restrictTo('super-admin', 'admin'), adminBulkController.bulkUnsuspendUsers);
router.post('/bulk/drivers/approve', protect, restrictTo('super-admin', 'admin', 'moderator'), adminBulkController.bulkApproveDrivers);
router.post('/bulk/drivers/reject', protect, restrictTo('super-admin', 'admin', 'moderator'), adminBulkController.bulkRejectDrivers);

// ==================== Export ====================
const adminExportController = require('../controllers/adminExport.controller');
router.get('/export/users', protect, adminExportController.exportUsers);
router.get('/export/drivers', protect, adminExportController.exportDrivers);
router.get('/export/deliveries', protect, adminExportController.exportDeliveries);

// ==================== System Health ====================
const adminSystemController = require('../controllers/adminSystem.controller');
router.get('/system/health', protect, adminSystemController.getSystemHealth);
router.get('/system/stats', protect, adminSystemController.getSystemStats);

// ==================== Notification Management ====================
const adminNotificationController = require('../controllers/adminNotification.controller');
// System-wide notifications (announcements)
router.get('/notifications', protect, adminNotificationController.getAllNotifications);
router.post('/notifications', protect, adminNotificationController.createNotification);
router.patch('/notifications/:id', protect, adminNotificationController.updateNotification);
router.delete('/notifications/:id', protect, adminNotificationController.deleteNotification);
// Admin personal notifications
router.get('/notifications/personal', protect, adminNotificationController.getAdminNotifications);
router.get('/notifications/badges', protect, adminNotificationController.getAdminBadgeCounts);
router.patch('/notifications/personal/:id/read', protect, adminNotificationController.markAdminNotificationAsRead);
router.patch('/notifications/personal/read-all', protect, adminNotificationController.markAllAdminNotificationsAsRead);
router.delete('/notifications/personal/:id', protect, adminNotificationController.deleteAdminNotification);

// ==================== Product Management ====================
const adminProductController = require('../controllers/adminProduct.controller');
router.get('/products', protect, adminProductController.getAllProducts);
router.get('/products/:id', protect, adminProductController.getProductById);
router.post('/products', protect, adminProductController.createProduct);
router.patch('/products/:id', protect, adminProductController.updateProduct);
router.delete('/products/:id', protect, restrictTo('super-admin', 'admin'), adminProductController.deleteProduct);

// ==================== Order Management ====================
const adminOrderController = require('../controllers/adminOrder.controller');
router.get('/orders', protect, adminOrderController.getAllOrders);
router.get('/orders/:id', protect, adminOrderController.getOrderById);
router.patch('/orders/:id/status', protect, adminOrderController.updateOrderStatus);

// ==================== Settings Management ====================
const adminSettingsController = require('../controllers/adminSettings.controller');
router.get('/settings', protect, adminSettingsController.getAllSettings);
router.get('/settings/:key', protect, adminSettingsController.getSettingByKey);
router.patch('/settings/:key', protect, restrictTo('super-admin', 'admin'), adminSettingsController.updateSetting);

// ==================== Admin Management (Super-Admin only) ====================
const adminManagementController = require('../controllers/adminManagement.controller');
router.get('/admins', protect, restrictTo('super-admin'), adminManagementController.getAllAdmins);
router.post('/admins', protect, restrictTo('super-admin'), adminManagementController.createAdmin);
router.patch('/admins/:id/suspend', protect, restrictTo('super-admin'), adminManagementController.suspendAdmin);
router.patch('/admins/:id/role', protect, restrictTo('super-admin'), adminManagementController.updateAdminRole);

// ==================== Role Application Review ====================
const adminRoleApplicationsController = require('../controllers/adminRoleApplications.controller');
router.get('/role-applications', protect, adminRoleApplicationsController.getAllApplications);
router.get('/role-applications/:userId/:role', protect, adminRoleApplicationsController.getApplicationById);
router.patch('/role-applications/:userId/:role/approve', protect, restrictTo('super-admin', 'admin'), adminRoleApplicationsController.approveApplication);
router.patch('/role-applications/:userId/:role/reject', protect, restrictTo('super-admin', 'admin'), adminRoleApplicationsController.rejectApplication);

// ==================== Logistics Company Management ====================
const adminLogisticsController = require('../controllers/adminLogistics.controller');
router.post('/logistics-companies/enroll', protect, restrictTo('super-admin'), adminLogisticsController.enrollCompany);
router.get('/logistics-companies', protect, adminLogisticsController.getAllCompanies);
router.get('/logistics-companies/:id', protect, adminLogisticsController.getCompanyById);
router.patch('/logistics-companies/:id/approve', protect, restrictTo('super-admin', 'admin'), adminLogisticsController.approveCompany);
router.patch('/logistics-companies/:id/reject', protect, restrictTo('super-admin', 'admin'), adminLogisticsController.rejectCompany);
router.patch('/logistics-companies/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminLogisticsController.suspendCompany);

// ==================== Sourcing Agent Management ====================
const adminSourcingController = require('../controllers/adminSourcing.controller');
router.get('/sourcing-agents', protect, adminSourcingController.getAllAgents);
router.get('/sourcing-agents/:id', protect, adminSourcingController.getAgentById);
router.patch('/sourcing-agents/:id/approve', protect, restrictTo('super-admin', 'admin', 'moderator'), adminSourcingController.approveAgent);
router.patch('/sourcing-agents/:id/reject', protect, restrictTo('super-admin', 'admin', 'moderator'), adminSourcingController.rejectAgent);
router.patch('/sourcing-agents/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminSourcingController.suspendAgent);

// ==================== Import Coach Management ====================
const adminImportCoachController = require('../controllers/adminImportCoach.controller');
router.get('/import-coaches', protect, adminImportCoachController.getAllCoaches);
router.get('/import-coaches/:id', protect, adminImportCoachController.getCoachById);
router.patch('/import-coaches/:id/approve', protect, restrictTo('super-admin', 'admin', 'moderator'), adminImportCoachController.approveCoach);
router.patch('/import-coaches/:id/reject', protect, restrictTo('super-admin', 'admin', 'moderator'), adminImportCoachController.rejectCoach);
router.patch('/import-coaches/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminImportCoachController.suspendCoach);

// ==================== Seller Management ====================
const adminSellerController = require('../controllers/adminSeller.controller');
router.get('/sellers', protect, adminSellerController.getAllSellers);
router.get('/sellers/:id', protect, adminSellerController.getSellerById);
router.patch('/sellers/:id/approve', protect, restrictTo('super-admin', 'admin', 'moderator'), adminSellerController.approveSeller);
router.patch('/sellers/:id/reject', protect, restrictTo('super-admin', 'admin', 'moderator'), adminSellerController.rejectSeller);
router.patch('/sellers/:id/suspend', protect, restrictTo('super-admin', 'admin'), adminSellerController.suspendSeller);

module.exports = router;

