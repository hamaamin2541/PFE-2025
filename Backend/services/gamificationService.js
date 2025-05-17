import User from '../models/User.js';
import Badge from '../models/Badge.js';
import mongoose from 'mongoose';

/**
 * Award points to a user
 * @param {string} userId - The user ID
 * @param {number} points - The number of points to award
 * @param {string} reason - The reason for awarding points
 * @returns {Promise<Object>} - The updated user object
 */
export const awardPoints = async (userId, points, reason) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add points to the user
    user.points += points;
    
    // Save the updated user
    await user.save();
    
    console.log(`Awarded ${points} points to user ${userId} for ${reason}`);
    
    return user;
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
};

/**
 * Award a badge to a user
 * @param {string} userId - The user ID
 * @param {string} badgeId - The badge ID
 * @returns {Promise<Object>} - The updated user object
 */
export const awardBadge = async (userId, badgeId) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await User.findById(userId).session(session);
      const badge = await Badge.findOne({ badgeId }).session(session);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!badge) {
        throw new Error('Badge not found');
      }
      
      // Check if user already has this badge
      const hasBadge = user.badges.some(b => b.badgeId === badgeId);
      
      if (hasBadge) {
        await session.abortTransaction();
        session.endSession();
        return user; // User already has this badge
      }
      
      // Add badge to user
      user.badges.push({
        badgeId: badge.badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date()
      });
      
      // Award points if the badge gives points
      if (badge.pointsAwarded > 0) {
        user.points += badge.pointsAwarded;
      }
      
      // Save the updated user
      await user.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      console.log(`Awarded badge ${badgeId} to user ${userId}`);
      
      return user;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
};

/**
 * Check and update user streak
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The updated user object
 */
export const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const now = new Date();
    const lastActivity = user.streak.lastActivity ? new Date(user.streak.lastActivity) : null;
    
    // If this is the first activity, initialize streak
    if (!lastActivity) {
      user.streak = {
        currentStreak: 1,
        lastActivity: now,
        highestStreak: 1
      };
    } else {
      // Calculate days between last activity and now
      const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActivity === 0) {
        // Already logged in today, no streak change
      } else if (daysSinceLastActivity === 1) {
        // Consecutive day, increase streak
        user.streak.currentStreak += 1;
        user.streak.lastActivity = now;
        
        // Update highest streak if current is higher
        if (user.streak.currentStreak > user.streak.highestStreak) {
          user.streak.highestStreak = user.streak.currentStreak;
        }
      } else {
        // Streak broken, reset to 1
        user.streak.currentStreak = 1;
        user.streak.lastActivity = now;
      }
    }
    
    await user.save();
    
    // Check for streak badges
    await checkStreakBadges(user);
    
    return user;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

/**
 * Check if user qualifies for streak badges
 * @param {Object} user - The user object
 */
const checkStreakBadges = async (user) => {
  try {
    // Get all streak badges
    const streakBadges = await Badge.find({
      category: 'streak',
      'criteria.type': 'streak',
      isActive: true
    }).sort({ 'criteria.threshold': 1 });
    
    for (const badge of streakBadges) {
      if (user.streak.currentStreak >= badge.criteria.threshold) {
        // Check if user already has this badge
        const hasBadge = user.badges.some(b => b.badgeId === badge.badgeId);
        
        if (!hasBadge) {
          // Award the badge
          await awardBadge(user._id, badge.badgeId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking streak badges:', error);
  }
};

/**
 * Handle course completion event
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - The updated user object
 */
export const handleCourseCompletion = async (userId, courseId) => {
  try {
    // Award points for completing a course
    const user = await awardPoints(userId, 50, `completing course ${courseId}`);
    
    // Check for course completion badges
    const courseBadges = await Badge.find({
      category: 'course',
      'criteria.type': 'course_completion',
      'criteria.courseId': courseId,
      isActive: true
    });
    
    for (const badge of courseBadges) {
      await awardBadge(userId, badge.badgeId);
    }
    
    // Check for course count badges
    const userEnrollments = await User.findById(userId).populate('enrollments');
    const completedCourses = userEnrollments.enrollments.filter(
      e => e.itemType === 'course' && e.status === 'completed'
    ).length;
    
    const courseCountBadges = await Badge.find({
      category: 'achievement',
      'criteria.type': 'course_count',
      isActive: true
    }).sort({ 'criteria.threshold': 1 });
    
    for (const badge of courseCountBadges) {
      if (completedCourses >= badge.criteria.threshold) {
        // Check if user already has this badge
        const hasBadge = user.badges.some(b => b.badgeId === badge.badgeId);
        
        if (!hasBadge) {
          // Award the badge
          await awardBadge(userId, badge.badgeId);
        }
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error handling course completion:', error);
    throw error;
  }
};

/**
 * Handle quiz completion event
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @param {number} score - The quiz score
 * @returns {Promise<Object>} - The updated user object
 */
export const handleQuizCompletion = async (userId, quizId, score) => {
  try {
    // Award points for completing a quiz
    const user = await awardPoints(userId, 30, `completing quiz ${quizId}`);
    
    // Award additional points for high scores
    if (score >= 90) {
      await awardPoints(userId, 20, `achieving high score on quiz ${quizId}`);
    } else if (score >= 75) {
      await awardPoints(userId, 10, `achieving good score on quiz ${quizId}`);
    }
    
    // Check for quiz completion badges
    const quizBadges = await Badge.find({
      category: 'quiz',
      'criteria.type': 'quiz_completion',
      'criteria.quizId': quizId,
      isActive: true
    });
    
    for (const badge of quizBadges) {
      await awardBadge(userId, badge.badgeId);
    }
    
    // Check for quiz count badges
    const userEnrollments = await User.findById(userId).populate('enrollments');
    const completedQuizzes = userEnrollments.enrollments.filter(
      e => e.itemType === 'test' && e.status === 'completed'
    ).length;
    
    const quizCountBadges = await Badge.find({
      category: 'achievement',
      'criteria.type': 'quiz_count',
      isActive: true
    }).sort({ 'criteria.threshold': 1 });
    
    for (const badge of quizCountBadges) {
      if (completedQuizzes >= badge.criteria.threshold) {
        // Check if user already has this badge
        const hasBadge = user.badges.some(b => b.badgeId === badge.badgeId);
        
        if (!hasBadge) {
          // Award the badge
          await awardBadge(userId, badge.badgeId);
        }
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error handling quiz completion:', error);
    throw error;
  }
};

/**
 * Handle lesson completion event
 * @param {string} userId - The user ID
 * @param {string} courseId - The course ID
 * @param {string} sectionId - The section ID
 * @returns {Promise<Object>} - The updated user object
 */
export const handleLessonCompletion = async (userId, courseId, sectionId) => {
  try {
    // Award points for completing a lesson
    const user = await awardPoints(userId, 10, `completing lesson in course ${courseId}`);
    
    return user;
  } catch (error) {
    console.error('Error handling lesson completion:', error);
    throw error;
  }
};
