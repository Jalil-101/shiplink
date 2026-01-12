/**
 * Logistics Company Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictToLogisticsCompany } = require('../middleware/logisticsAuth');
const logisticsCompanyController = require('../controllers/logisticsCompany.controller');
const logisticsDashboardController = require('../controllers/logisticsDashboard.controller');
const logisticsDocumentController = require('../controllers/logisticsDocument.controller');
const logisticsQuoteController = require('../controllers/logisticsQuote.controller');
const logisticsInvoiceController = require('../controllers/logisticsInvoice.controller');
const logisticsBarcodeController = require('../controllers/logisticsBarcode.controller');
const logisticsAlertRuleController = require('../controllers/logisticsAlertRule.controller');
const logisticsReturnController = require('../controllers/logisticsReturn.controller');
const chatController = require('../controllers/chat.controller');

// Public routes
router.get('/', logisticsCompanyController.getAllCompanies);

// Protected routes (logistics-company role only - web dashboard access)
router.post('/create-profile', protect, restrictToLogisticsCompany, logisticsCompanyController.createProfile);
router.get('/profile', protect, restrictToLogisticsCompany, logisticsCompanyController.getProfile);
router.patch('/profile', protect, restrictToLogisticsCompany, logisticsCompanyController.updateProfile);

// Dashboard routes (logistics-company role only)
router.get('/dashboard/overview', protect, restrictToLogisticsCompany, logisticsDashboardController.getOverview);
router.get('/dashboard/orders', protect, restrictToLogisticsCompany, logisticsDashboardController.getOrders);
router.get('/dashboard/orders/:orderId', protect, restrictToLogisticsCompany, logisticsDashboardController.getOrderDetails);
router.get('/dashboard/analytics', protect, restrictToLogisticsCompany, logisticsDashboardController.getAnalytics);
router.get('/dashboard/drivers', protect, restrictToLogisticsCompany, logisticsDashboardController.getDrivers);

// Document routes
router.post('/dashboard/orders/:orderId/documents', protect, restrictToLogisticsCompany, logisticsDocumentController.uploadDocument);
router.get('/dashboard/orders/:orderId/documents', protect, restrictToLogisticsCompany, logisticsDocumentController.getDocuments);
router.delete('/dashboard/orders/:orderId/documents/:docId', protect, restrictToLogisticsCompany, logisticsDocumentController.deleteDocument);

// Scheduling and dispatching routes
router.post('/dashboard/orders/:orderId/schedule-pickup', protect, restrictToLogisticsCompany, logisticsDashboardController.schedulePickup);
router.post('/dashboard/orders/:orderId/schedule-delivery', protect, restrictToLogisticsCompany, logisticsDashboardController.scheduleDelivery);
router.post('/dashboard/orders/:orderId/assign-driver', protect, restrictToLogisticsCompany, logisticsDashboardController.assignDriver);

// Quote routes
router.post('/dashboard/quotes/calculate', protect, restrictToLogisticsCompany, logisticsQuoteController.calculateQuote);
router.post('/dashboard/quotes', protect, restrictToLogisticsCompany, logisticsQuoteController.createQuote);
router.get('/dashboard/quotes', protect, restrictToLogisticsCompany, logisticsQuoteController.getQuotes);
router.get('/dashboard/quotes/:quoteId', protect, restrictToLogisticsCompany, logisticsQuoteController.getQuoteDetails);

// Invoice routes
router.post('/dashboard/invoices', protect, restrictToLogisticsCompany, logisticsInvoiceController.createInvoice);
router.get('/dashboard/invoices', protect, restrictToLogisticsCompany, logisticsInvoiceController.getInvoices);
router.get('/dashboard/invoices/:invoiceId', protect, restrictToLogisticsCompany, logisticsInvoiceController.getInvoiceDetails);
router.patch('/dashboard/invoices/:invoiceId/status', protect, restrictToLogisticsCompany, logisticsInvoiceController.updateInvoiceStatus);

// Barcode/QR routes
router.get('/dashboard/orders/:orderId/barcode', protect, restrictToLogisticsCompany, logisticsBarcodeController.generateOrderBarcode);
router.get('/dashboard/orders/:orderId/qr', protect, restrictToLogisticsCompany, logisticsBarcodeController.generateOrderQR);

// Alert rule routes
router.post('/dashboard/alert-rules', protect, restrictToLogisticsCompany, logisticsAlertRuleController.createAlertRule);
router.get('/dashboard/alert-rules', protect, restrictToLogisticsCompany, logisticsAlertRuleController.getAlertRules);
router.patch('/dashboard/alert-rules/:ruleId', protect, restrictToLogisticsCompany, logisticsAlertRuleController.updateAlertRule);
router.delete('/dashboard/alert-rules/:ruleId', protect, restrictToLogisticsCompany, logisticsAlertRuleController.deleteAlertRule);

// Return/Reverse logistics routes
router.get('/dashboard/returns', protect, restrictToLogisticsCompany, logisticsReturnController.getReturns);
router.get('/dashboard/returns/:returnId', protect, restrictToLogisticsCompany, logisticsReturnController.getReturnDetails);
router.patch('/dashboard/returns/:returnId/status', protect, restrictToLogisticsCompany, logisticsReturnController.updateReturnStatus);

// Chat routes
router.get('/dashboard/chat/conversations', protect, restrictToLogisticsCompany, chatController.getCompanyConversations);
router.get('/dashboard/chat/order/:orderId', protect, restrictToLogisticsCompany, chatController.getCompanyChat);
router.post('/dashboard/chat/order/:orderId/message', protect, restrictToLogisticsCompany, chatController.sendCompanyMessage);

module.exports = router;



