import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessage, getConversation, getInbox, markAsRead, markConversationAsRead } from '../controllers/messageController.js';

const router = express.Router();

// Send a message
router.post('/', protect, sendMessage);

// Get inbox (latest per conversation)
router.get('/inbox', protect, getInbox);

// Get conversation with a participant
router.get('/conversation/:participantId', protect, getConversation);

// Mark whole conversation as read
router.patch('/conversation/:participantId/read', protect, markConversationAsRead);

// Mark a message as read
router.patch('/:id/read', protect, markAsRead);


export default router;
