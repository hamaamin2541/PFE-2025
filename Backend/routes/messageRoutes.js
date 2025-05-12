import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  sendMessage, 
  getMessages, 
  markAsRead, 
  moveToTrash,
  toggleStarred
} from '../controllers/messageController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Send a new message
router.post('/', sendMessage);

// Get messages for the current user
router.get('/', getMessages);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Move message to trash
router.put('/:messageId/trash', moveToTrash);

// Toggle starred status
router.put('/:messageId/star', toggleStarred);

export default router;
