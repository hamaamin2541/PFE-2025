import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  sendMessage,
  getMessages,
  markAsRead,
  moveToTrash,
  toggleStarred,
  getUnreadCount,
  adminSendMessage
} from '../controllers/messageController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Send a new message
router.post('/', sendMessage);

// Get messages for the current user
router.get('/', getMessages);

// Get count of unread messages
router.get('/unread/count', getUnreadCount);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Move message to trash
router.put('/:messageId/trash', moveToTrash);

// Toggle starred status
router.put('/:messageId/star', toggleStarred);

// Admin routes
router.post('/admin/send', adminOnly, adminSendMessage);

export default router;
