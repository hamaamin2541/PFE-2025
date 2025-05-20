/**
 * Course Recommendation Controller
 * 
 * This controller handles API requests related to course recommendations.
 */

import { getRecommendedCourses } from '../services/recommendationService.js';

/**
 * Get personalized course recommendations for the current user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserRecommendations = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;
    
    // Get limit from query params or use default
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    // Get recommendations from service
    const recommendations = await getRecommendedCourses(userId, limit);
    
    // Return recommendations
    return res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations',
      error: error.message
    });
  }
};
