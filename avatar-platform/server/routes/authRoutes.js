const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password-request', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);

// Protected routes
router.get('/current-user', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/wallet-address', authMiddleware, authController.updateWalletAddress);

module.exports = router;