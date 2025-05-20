import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  rateTeacher,
  getTeacherRatings,
  getTeacherAverageRating
} from '../controllers/teacherRatingController.js';

const router = express.Router();

// Route pour noter un professeur (nécessite d'être connecté)
router.post('/', protect, rateTeacher);

// Route pour obtenir les notes d'un professeur
router.get('/:teacherId', protect, getTeacherRatings);

// Route pour obtenir la note moyenne d'un professeur (accessible publiquement)
router.get('/:teacherId/average', getTeacherAverageRating);

export default router;
