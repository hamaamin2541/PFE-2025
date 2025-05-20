import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAllAssistants,
  checkEligibility,
  promoteStudent,
  demoteAssistant,
  getEligibleStudents
} from '../controllers/assistantController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all assistants
router.get('/', getAllAssistants);

// Check if a student is eligible to be an assistant
router.get('/eligibility/:userId', authorize('teacher', 'admin'), checkEligibility);

// Get all eligible students
router.get('/eligible-students', authorize('teacher', 'admin'), getEligibleStudents);

// Promote a student to assistant
router.post('/promote/:userId', authorize('teacher', 'admin'), promoteStudent);

// Demote an assistant to student
router.post('/demote/:userId', authorize('teacher', 'admin'), demoteAssistant);

export default router;
