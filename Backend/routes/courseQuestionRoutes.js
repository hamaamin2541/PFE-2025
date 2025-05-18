import express from 'express';
import { protect, assistantOrHigher } from '../middleware/auth.js';
import {
  getCourseQuestions,
  getQuestion,
  createQuestion,
  addAnswer,
  markAsResolved,
  markAsInappropriate,
  getPendingQuestions,
  markAnswerAsHelpful,
  claimQuestion
} from '../controllers/courseQuestionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all pending questions (for assistants, teachers, and admins)
router.get('/pending', assistantOrHigher, getPendingQuestions);

// Get all questions for a course
router.get('/course/:courseId', getCourseQuestions);

// Get a single question
router.get('/:questionId', getQuestion);

// Create a new question
router.post('/course/:courseId', createQuestion);

// Add an answer to a question
router.post('/:questionId/answers', addAnswer);

// Mark a question as resolved
router.put('/:questionId/resolve', markAsResolved);

// Claim a question as an assistant
router.put('/:questionId/claim', assistantOrHigher, claimQuestion);

// Mark an answer as helpful
router.put('/:questionId/answers/:answerId/helpful', markAnswerAsHelpful);

// Mark a question or answer as inappropriate
router.put('/:questionId/inappropriate', markAsInappropriate);
router.put('/:questionId/answers/:answerId/inappropriate', markAsInappropriate);

export default router;
