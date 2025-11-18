const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const checkProfileComplete = require('../middleware/profileMiddleware');

// Apply both authentication and profile check middleware to all routes
router.use(authMiddleware);
router.use(checkProfileComplete);

// Routes
router.post('/send', messageController.sendMessage);
router.get('/conversation/:otherUserId', messageController.getConversation);
router.get('/conversations', messageController.getConversations);
router.get('/users', messageController.getMessagingUsers);

module.exports = router;
