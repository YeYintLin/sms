const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { authLoginRateLimit, authRegisterRateLimit } = require('../middleware/rateLimit.middleware');

// @route   POST /api/auth/register
router.post('/register', authRegisterRateLimit, authController.register);

// @route   POST /api/auth/login
router.post('/login', authLoginRateLimit, authController.login);

// @route   GET /api/auth/me
router.get('/me', auth, authController.getUser);

// @route   PUT /api/auth/me
router.put('/me', auth, authController.updateUser);

module.exports = router;
