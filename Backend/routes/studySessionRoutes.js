import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createStudySession,
  getUserStudySessions,
  getStudySessionById,
  acceptStudySession,
  cancelStudySession,
  addMessage
} from '../controllers/studySessionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a new study session
router.post('/', createStudySession);

// Get all study sessions for the current user
router.get('/', getUserStudySessions);

// Get a specific study session
router.get('/:sessionId', getStudySessionById);

// Accept a study session invitation
router.put('/:sessionId/accept', acceptStudySession);

// Cancel a study session
router.put('/:sessionId/cancel', cancelStudySession);

// Add a message to the study session
router.post('/:sessionId/messages', addMessage);

export default router;
