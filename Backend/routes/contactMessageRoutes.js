import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  replyToContactMessage,
  deleteContactMessage
} from '../controllers/contactMessageController.js';

const router = express.Router();

// Route publique pour créer un message de contact
router.post('/', createContactMessage);

// Routes protégées pour les administrateurs
router.use(protect);
router.use(adminOnly);

router.get('/', getAllContactMessages);
router.get('/:id', getContactMessageById);
router.put('/:id/status', updateContactMessageStatus);
router.post('/:id/reply', replyToContactMessage);
router.delete('/:id', deleteContactMessage);

export default router;
