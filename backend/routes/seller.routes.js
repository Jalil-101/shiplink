/**
 * Seller Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const sellerController = require('../controllers/seller.controller');

// Public routes
router.get('/:id/products', sellerController.getSellerProducts);

// Protected routes (seller role)
router.post('/create-profile', protect, sellerController.createProfile);
router.get('/profile', protect, sellerController.getProfile);
router.patch('/profile', protect, sellerController.updateProfile);

// Seller product management
router.get('/products/my-products', protect, sellerController.getMyProducts);
router.post('/products', protect, sellerController.createProduct);
router.put('/products/:id', protect, sellerController.updateProduct);
router.delete('/products/:id', protect, sellerController.deleteProduct);

module.exports = router;



