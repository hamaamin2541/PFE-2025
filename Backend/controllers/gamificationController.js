import User from '../models/User.js';
import Badge from '../models/Badge.js';
import * as gamificationService from '../services/gamificationService.js';

/**
 * Get user points and badges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserGamification = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('points badges streak');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        points: user.points,
        badges: user.badges,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Error getting user gamification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user gamification',
      error: error.message
    });
  }
};

/**
 * Get all available badges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true });
    
    return res.status(200).json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error getting badges:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting badges',
      error: error.message
    });
  }
};

/**
 * Create a new badge (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createBadge = async (req, res) => {
  try {
    const {
      badgeId,
      name,
      description,
      icon,
      category,
      criteria,
      pointsAwarded
    } = req.body;
    
    // Check if badge with this ID already exists
    const existingBadge = await Badge.findOne({ badgeId });
    
    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: 'Badge with this ID already exists'
      });
    }
    
    // Create new badge
    const badge = new Badge({
      badgeId,
      name,
      description,
      icon,
      category,
      criteria,
      pointsAwarded: pointsAwarded || 0,
      isActive: true
    });
    
    await badge.save();
    
    return res.status(201).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating badge',
      error: error.message
    });
  }
};

/**
 * Update a badge (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    
    const badge = await Badge.findOne({ badgeId });
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }
    
    // Update badge fields
    const updateFields = [
      'name',
      'description',
      'icon',
      'category',
      'criteria',
      'pointsAwarded',
      'isActive'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        badge[field] = req.body[field];
      }
    });
    
    await badge.save();
    
    return res.status(200).json({
      success: true,
      data: badge
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating badge',
      error: error.message
    });
  }
};

/**
 * Get leaderboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'student' })
      .select('fullName profileImage points badges')
      .sort({ points: -1 })
      .limit(10);
    
    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting leaderboard',
      error: error.message
    });
  }
};

/**
 * Award points to a user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const awardPointsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a positive number'
      });
    }
    
    const user = await gamificationService.awardPoints(userId, points, reason || 'manual award');
    
    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    return res.status(500).json({
      success: false,
      message: 'Error awarding points',
      error: error.message
    });
  }
};

/**
 * Award badge to a user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const awardBadgeToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeId } = req.body;
    
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Badge ID is required'
      });
    }
    
    const user = await gamificationService.awardBadge(userId, badgeId);
    
    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return res.status(500).json({
      success: false,
      message: 'Error awarding badge',
      error: error.message
    });
  }
};
