/**
 * Course Recommendation Routes
 * 
 * This file defines API routes for course recommendations.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get personalized recommendations for the current user
router.get('/', getUserRecommendations);

export default router;
