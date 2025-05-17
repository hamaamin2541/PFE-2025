import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Test from '../models/Test.js';
import mongoose from 'mongoose';

/**
 * Check if a student meets the criteria to be promoted to assistant
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - Object with eligibility status and details
 */
export const checkAssistantEligibility = async (userId) => {
  try {
    // Get the user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only students can be promoted to assistants
    if (user.role !== 'student') {
      return {
        eligible: false,
        reason: 'Only students can be promoted to assistants',
        details: {
          role: user.role
        }
      };
    }
    
    // Check criteria 1: Has completed at least 3 courses
    const completedEnrollments = await Enrollment.countDocuments({
      user: userId,
      status: 'completed',
      itemType: 'course'
    });
    
    const hasCompletedThreeCourses = completedEnrollments >= 3;
    
    // Check criteria 2: Has an average quiz score above 80%
    const testEnrollments = await Enrollment.find({
      user: userId,
      itemType: 'test',
      status: 'completed'
    }).populate('test');
    
    let averageScore = 0;
    let totalTests = 0;
    
    if (testEnrollments.length > 0) {
      // Calculate average score from test participants
      const testIds = testEnrollments.map(enrollment => enrollment.test);
      
      const tests = await Test.find({
        _id: { $in: testIds }
      });
      
      let totalScore = 0;
      
      for (const test of tests) {
        const participant = test.participants.find(p => p.user.toString() === userId);
        if (participant) {
          totalScore += participant.score;
          totalTests++;
        }
      }
      
      averageScore = totalTests > 0 ? totalScore / totalTests : 0;
    }
    
    const hasHighQuizScore = averageScore >= 80;
    
    // Check criteria 3: Has logged in at least 10 times in the past 2 weeks
    // Note: We don't have login tracking in the current model, so we'll use a placeholder
    // In a real implementation, you would check login records
    // For now, we'll assume this criterion is met if the user has recent activity
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Check for recent enrollments or updates as a proxy for login activity
    const recentActivity = await Enrollment.countDocuments({
      user: userId,
      $or: [
        { updatedAt: { $gte: twoWeeksAgo } },
        { lastAccessDate: { $gte: twoWeeksAgo } }
      ]
    });
    
    const hasRecentLogins = recentActivity >= 10;
    
    // Determine overall eligibility
    const isEligible = hasCompletedThreeCourses && hasHighQuizScore && hasRecentLogins;
    
    return {
      eligible: isEligible,
      details: {
        completedCourses: completedEnrollments,
        hasCompletedThreeCourses,
        averageQuizScore: averageScore,
        hasHighQuizScore,
        recentActivity,
        hasRecentLogins
      }
    };
  } catch (error) {
    console.error('Error checking assistant eligibility:', error);
    throw error;
  }
};

/**
 * Promote a student to assistant role
 * @param {string} userId - The user ID to promote
 * @param {boolean} checkEligibility - Whether to check eligibility criteria
 * @returns {Promise<Object>} - The updated user
 */
export const promoteToAssistant = async (userId, checkEligibility = true) => {
  try {
    // Get the user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only students can be promoted to assistants
    if (user.role !== 'student') {
      throw new Error('Only students can be promoted to assistants');
    }
    
    // Check eligibility if required
    if (checkEligibility) {
      const eligibility = await checkAssistantEligibility(userId);
      
      if (!eligibility.eligible) {
        throw new Error('User does not meet the criteria to be promoted to assistant');
      }
    }
    
    // Update the user role
    user.role = 'assistant';
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error promoting to assistant:', error);
    throw error;
  }
};

/**
 * Demote an assistant back to student role
 * @param {string} userId - The user ID to demote
 * @returns {Promise<Object>} - The updated user
 */
export const demoteToStudent = async (userId) => {
  try {
    // Get the user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only assistants can be demoted to students
    if (user.role !== 'assistant') {
      throw new Error('Only assistants can be demoted to students');
    }
    
    // Update the user role
    user.role = 'student';
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error demoting to student:', error);
    throw error;
  }
};
