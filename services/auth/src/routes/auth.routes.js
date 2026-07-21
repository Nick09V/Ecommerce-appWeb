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

// Auth endpoints
router.post('/signup', signupRules, validate, authController.signup);
router.post('/signin', signinRules, validate, authController.signin);
router.get('/me', requireAuth, authController.getProfile);
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;
