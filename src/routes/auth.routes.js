const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireGuest } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  signinRules,
  signupRules,
  resetPasswordEmailRules,
  resetPasswordRules,
} = require('../validators/auth.validator');

const router = express.Router();

// Sign In
router.get('/signin', requireGuest, authController.getSignin);
router.post('/signin', requireGuest, signinRules, validate, authController.postSignin);

// Sign Up
router.get('/signup', requireGuest, authController.getSignup);
router.post('/signup', requireGuest, signupRules, validate, authController.postSignup);

// Reset Password
router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password/verify', resetPasswordEmailRules, validate, authController.postVerifyEmail);
router.post('/reset-password', resetPasswordRules, validate, authController.postResetPassword);

// Sign Out
router.post('/signout', authController.postSignout);

module.exports = router;
