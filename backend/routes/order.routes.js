/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/track', orderController.trackOrder);
router.get('/user/my-orders', orderController.getUserOrders); // Backward compatibility
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;


