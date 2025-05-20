import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserEnrollments,
  enroll,
  updateEnrollmentProgress,
  getEnrollment
} from '../controllers/enrollmentController.js';

const router = express.Router();

// Get all enrollments for the current user
router.get('/', protect, getUserEnrollments);

// Get a specific enrollment
router.get('/:enrollmentId', protect, getEnrollment);

// Enroll in a course
router.post('/', protect, enroll);

// Update enrollment progress
router.put('/:enrollmentId', protect, updateEnrollmentProgress);

export default router;
