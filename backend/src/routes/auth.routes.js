const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { authLoginRateLimit, authRegisterRateLimit } = require('../middleware/rateLimit.middleware');
const { validateRegister, validateLogin, validateUpdateUser } = require('../middleware/auth.validation');
const validate = require('../middleware/validate.middleware');

// @route   POST /api/auth/register
router.post('/register', authRegisterRateLimit, validateRegister, validate, authController.register);

// @route   POST /api/auth/login
router.post('/login', authLoginRateLimit, validateLogin, validate, authController.login);

// @route   GET /api/auth/me
router.get('/me', auth, authController.getUser);

// @route   PUT /api/auth/me
router.put('/me', auth, validateUpdateUser, validate, authController.updateUser);

// @route   POST /api/auth/logout
router.post('/logout', auth, authController.logout);

module.exports = router;
