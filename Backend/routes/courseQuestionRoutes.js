import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCourseQuestions,
  getQuestion,
  createQuestion,
  addAnswer,
  markAsResolved,
  markAsInappropriate
} from '../controllers/courseQuestionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

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

// Mark a question or answer as inappropriate
router.put('/:questionId/inappropriate', markAsInappropriate);
router.put('/:questionId/answers/:answerId/inappropriate', markAsInappropriate);

export default router;
