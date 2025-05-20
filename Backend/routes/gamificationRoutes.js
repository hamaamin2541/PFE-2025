import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  getUserGamification,
  getAllBadges,
  createBadge,
  updateBadge,
  getLeaderboard,
  awardPointsToUser,
  awardBadgeToUser
} from '../controllers/gamificationController.js';

const router = express.Router();

// Custom middleware for debugging auth issues
const debugAuth = async (req, res, next) => {
  console.log('Debug Auth Middleware - Headers:', JSON.stringify(req.headers));

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Debug Auth: No valid Authorization header found');
      return res.status(401).json({
        success: false,
        message: 'No valid Authorization header found'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Debug Auth: Token found, length:', token.length);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Debug Auth: Token verified, user ID:', decoded.id);

      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('Debug Auth: User not found with ID:', decoded.id);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('Debug Auth: User authenticated:', user.email);
      req.user = user;
      next();
    } catch (error) {
      console.error('Debug Auth: Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Debug Auth: Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in auth middleware'
    });
  }
};

// Simple test endpoint that doesn't require authentication
router.get('/test', (req, res) => {
  console.log('Gamification test endpoint called');
  return res.status(200).json({
    success: true,
    message: 'Gamification API is working',
    timestamp: new Date().toISOString()
  });
});

// Get user points and badges - use debug middleware
router.get('/user', debugAuth, getUserGamification);

// Get all available badges
router.get('/badges', protect, getAllBadges);

// Get leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Admin routes
router.post('/badges', protect, authorize('admin'), createBadge);
router.put('/badges/:badgeId', protect, authorize('admin'), updateBadge);
router.post('/users/:userId/points', protect, authorize('admin'), awardPointsToUser);
router.post('/users/:userId/badges', protect, authorize('admin'), awardBadgeToUser);

export default router;
