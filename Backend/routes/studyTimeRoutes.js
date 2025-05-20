import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  startStudySession,
  endStudySession,
  getWeeklyStats,
  getHistoricalStats
} from '../controllers/studyTimeController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Start a study session
router.post('/start', startStudySession);

// End a study session
router.post('/end', endStudySession);

// Get weekly statistics
router.get('/weekly', getWeeklyStats);

// Get historical statistics (last 4 weeks by default)
router.get('/historical', getHistoricalStats);

export default router;
