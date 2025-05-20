/**
 * Course Recommendation Service
 * 
 * This service provides recommendation algorithms for suggesting courses to students
 * based on their past activity, interests, and course completions.
 */

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

/**
 * Get recommended courses for a user based on their history and preferences
 * 
 * @param {string} userId - The ID of the user to get recommendations for
 * @param {number} limit - Maximum number of recommendations to return (default: 5)
 * @returns {Promise<Array>} - Array of recommended course objects
 */
export const getRecommendedCourses = async (userId, limit = 5) => {
  try {
    // 1. Get user's enrollments
    const userEnrollments = await Enrollment.find({ 
      user: userId,
      itemType: 'course'
    })
    .populate('course')
    .lean();

    // If user has no enrollments, return popular courses
    if (!userEnrollments || userEnrollments.length === 0) {
      return getPopularCourses(limit);
    }

    // 2. Extract categories and completed courses
    const userCourseIds = userEnrollments.map(enrollment => 
      enrollment.course?._id
    ).filter(id => id); // Filter out null/undefined
    
    const userCategories = userEnrollments
      .map(enrollment => enrollment.course?.category)
      .filter(category => category); // Filter out null/undefined
    
    // 3. Find courses in the same categories that the user hasn't enrolled in yet
    const recommendedCourses = await Course.find({
      _id: { $nin: userCourseIds },
      category: { $in: userCategories }
    })
    .populate('teacher', 'fullName profileImage')
    .sort({ views: -1 }) // Sort by popularity
    .limit(limit)
    .lean();

    // 4. If we don't have enough recommendations, add some popular courses
    if (recommendedCourses.length < limit) {
      const additionalCourses = await getAdditionalRecommendations(
        userCourseIds, 
        recommendedCourses.map(course => course._id),
        limit - recommendedCourses.length
      );
      
      return [...recommendedCourses, ...additionalCourses];
    }

    return recommendedCourses;
  } catch (error) {
    console.error('Error in recommendation service:', error);
    // Fallback to popular courses if there's an error
    return getPopularCourses(limit);
  }
};

/**
 * Get popular courses as a fallback recommendation strategy
 * 
 * @param {number} limit - Maximum number of courses to return
 * @returns {Promise<Array>} - Array of course objects
 */
export const getPopularCourses = async (limit = 5) => {
  try {
    // Get courses with the most views and enrollments
    return await Course.find()
      .populate('teacher', 'fullName profileImage')
      .sort({ views: -1, 'enrollments.length': -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Error getting popular courses:', error);
    return [];
  }
};

/**
 * Get additional course recommendations when category-based recommendations
 * are not sufficient
 * 
 * @param {Array} userCourseIds - IDs of courses the user is already enrolled in
 * @param {Array} alreadyRecommendedIds - IDs of courses already in the recommendation list
 * @param {number} limit - Maximum number of additional recommendations
 * @returns {Promise<Array>} - Array of additional course recommendations
 */
export const getAdditionalRecommendations = async (
  userCourseIds, 
  alreadyRecommendedIds, 
  limit
) => {
  try {
    // Find popular courses the user hasn't enrolled in yet and aren't already recommended
    const excludedIds = [...userCourseIds, ...alreadyRecommendedIds];
    
    return await Course.find({
      _id: { $nin: excludedIds }
    })
    .populate('teacher', 'fullName profileImage')
    .sort({ views: -1, 'enrollments.length': -1 })
    .limit(limit)
    .lean();
  } catch (error) {
    console.error('Error getting additional recommendations:', error);
    return [];
  }
};
