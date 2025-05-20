import express from 'express';
import { protect, assistantOrHigher } from '../middleware/authMiddleware.js';
import {
  getAssistantHelpRequests,
  getStudentHelpRequests,
  createHelpRequest,
  acceptHelpRequest,
  completeHelpRequest,
  getAvailableAssistants,
  getAssistantStats
} from '../controllers/assistantHelpController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes for students
router.post('/help-requests', createHelpRequest);
router.get('/my-help-requests', getStudentHelpRequests);

// Routes for assistants
router.get('/help-requests', assistantOrHigher, getAssistantHelpRequests);
router.post('/help-requests/:requestId/accept', assistantOrHigher, acceptHelpRequest);
router.post('/help-requests/:requestId/complete', assistantOrHigher, completeHelpRequest);
router.get('/stats', assistantOrHigher, getAssistantStats);

// Get available assistants
router.get('/available', getAvailableAssistants);

export default router;
