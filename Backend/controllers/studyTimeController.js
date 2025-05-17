import StudyTime from '../models/StudyTime.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Start a study session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const startStudySession = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    const userId = req.user._id;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'Content type and content ID are required'
      });
    }

    // Check for any active sessions for this user and content
    const activeSession = await StudyTime.findOne({
      user: userId,
      contentType,
      contentId,
      isActive: true
    });

    if (activeSession) {
      return res.status(200).json({
        success: true,
        message: 'Study session already in progress',
        data: activeSession
      });
    }

    // Get current week info
    const { weekNumber, year } = StudyTime.getCurrentWeekInfo();

    // Create a new study session
    const studySession = new StudyTime({
      user: userId,
      contentType,
      contentId,
      weekNumber,
      year,
      startTime: new Date(),
      isActive: true
    });

    await studySession.save();

    return res.status(201).json({
      success: true,
      message: 'Study session started',
      data: studySession
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting study session',
      error: error.message
    });
  }
};

/**
 * End a study session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const endStudySession = async (req, res) => {
  try {
    const { sessionId, completedContent } = req.body;
    const userId = req.user._id;

    // Find the active session
    const studySession = await StudyTime.findOne({
      _id: sessionId,
      user: userId,
      isActive: true
    });

    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: 'Active study session not found'
      });
    }

    // Update the session
    studySession.endTime = new Date();
    studySession.isActive = false;
    studySession.completedContent = completedContent || false;

    await studySession.save();

    return res.status(200).json({
      success: true,
      message: 'Study session ended',
      data: studySession
    });
  } catch (error) {
    console.error('Error ending study session:', error);
    return res.status(500).json({
      success: false,
      message: 'Error ending study session',
      error: error.message
    });
  }
};

/**
 * Get weekly study statistics for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWeeklyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { weekNumber, year } = req.query;

    // Get user's weekly stats
    const userStats = await StudyTime.getWeeklyStats(
      userId, 
      weekNumber ? parseInt(weekNumber) : null,
      year ? parseInt(year) : null
    );

    // Get platform average for comparison
    const platformStats = await StudyTime.getPlatformAverage(
      weekNumber ? parseInt(weekNumber) : null,
      year ? parseInt(year) : null
    );

    // Calculate percentile (what percentage of users study less than this user)
    let percentile = 0;
    if (platformStats.userCount > 0 && userStats.totalMinutes > 0) {
      // Get all users' total minutes for the week
      const weekInfo = weekNumber && year 
        ? { weekNumber: parseInt(weekNumber), year: parseInt(year) } 
        : StudyTime.getCurrentWeekInfo();
      
      const allUserStats = await StudyTime.aggregate([
        {
          $match: {
            weekNumber: weekInfo.weekNumber,
            year: weekInfo.year
          }
        },
        {
          $group: {
            _id: '$user',
            totalMinutes: { $sum: '$duration' }
          }
        },
        {
          $sort: { totalMinutes: 1 }
        }
      ]);
      
      // Find position of current user
      const userPosition = allUserStats.findIndex(
        stat => stat.totalMinutes < userStats.totalMinutes
      );
      
      if (userPosition >= 0) {
        percentile = Math.round((userPosition / allUserStats.length) * 100);
      }
    }

    // Format hours and minutes
    const hours = Math.floor(userStats.totalMinutes / 60);
    const minutes = userStats.totalMinutes % 60;
    const formattedTime = `${hours}h ${minutes}min`;

    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          ...userStats,
          formattedTime
        },
        platformStats,
        percentile
      }
    });
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting weekly stats',
      error: error.message
    });
  }
};

/**
 * Get historical study statistics (last 4 weeks)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHistoricalStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { weekCount = 4 } = req.query;
    
    // Get current week info
    const currentWeekInfo = StudyTime.getCurrentWeekInfo();
    
    // Generate array of weeks to query
    const weeks = [];
    for (let i = 0; i < parseInt(weekCount); i++) {
      const weekNumber = currentWeekInfo.weekNumber - i;
      const year = currentWeekInfo.year;
      
      // Handle year boundary
      if (weekNumber <= 0) {
        weeks.push({
          weekNumber: 52 + weekNumber, // Wrap around to previous year
          year: year - 1
        });
      } else {
        weeks.push({ weekNumber, year });
      }
    }
    
    // Get stats for each week
    const weeklyStats = [];
    for (const week of weeks) {
      const stats = await StudyTime.getWeeklyStats(userId, week.weekNumber, week.year);
      weeklyStats.push({
        ...stats,
        weekNumber: week.weekNumber,
        year: week.year
      });
    }
    
    return res.status(200).json({
      success: true,
      data: weeklyStats
    });
  } catch (error) {
    console.error('Error getting historical stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting historical stats',
      error: error.message
    });
  }
};
