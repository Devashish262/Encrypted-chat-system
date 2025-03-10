const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

// Send a message
router.post('/', messageController.sendMessage);

// Get conversation with a specific user
router.get('/conversation/:userId', messageController.getConversation);

// Get all conversations
router.get('/conversations', messageController.getAllConversations);

module.exports = router; 