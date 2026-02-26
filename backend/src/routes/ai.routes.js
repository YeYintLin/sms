const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const aiController = require('../controllers/ai.controller');

// @route   POST /api/ai/chat
router.post('/chat', auth, aiController.chat);

module.exports = router;
