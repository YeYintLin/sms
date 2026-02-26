const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');

// @route   GET /api/messages/conversations
router.get('/conversations', auth, messageController.listConversations);

// @route   GET /api/messages/unread-count
router.get('/unread-count', auth, messageController.getUnreadCount);

// @route   GET /api/messages/unread
router.get('/unread', auth, messageController.getUnreadMessages);

// @route   GET /api/messages/contacts
router.get('/contacts', auth, messageController.getContacts);

// @route   POST /api/messages/conversations
router.post('/conversations', auth, messageController.getOrCreateConversation);

// @route   GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', auth, messageController.getMessages);

// @route   POST /api/messages/conversations/:id/messages
router.post('/conversations/:id/messages', auth, messageController.sendMessage);

module.exports = router;
