const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  signupRules,
  signinRules,
  resetPasswordRules,
} = require('../validators/auth.validator');

const router = express.Router();

// Health check
router.get('/health', authController.health);

// Public routes
router.post('/signup', signupRules, validate, authController.signup);
router.post('/signin', signinRules, validate, authController.signin);
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);

// Protected routes
router.get('/me', requireAuth, authController.getProfile);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;