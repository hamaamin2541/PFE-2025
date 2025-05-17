import { api } from '../config/api';

/**
 * Start a study session
 * @param {string} contentType - Type of content (course, test, formation)
 * @param {string} contentId - ID of the content
 * @returns {Promise<Object>} - Study session data
 */
export const startStudySession = async (contentType, contentId) => {
  try {
    const response = await api.post('/api/study-time/start', {
      contentType,
      contentId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error starting study session:', error);
    throw error;
  }
};

/**
 * End a study session
 * @param {string} sessionId - ID of the study session
 * @param {boolean} completedContent - Whether the content was completed
 * @returns {Promise<Object>} - Updated study session data
 */
export const endStudySession = async (sessionId, completedContent = false) => {
  try {
    const response = await api.post('/api/study-time/end', {
      sessionId,
      completedContent
    });
    
    return response.data;
  } catch (error) {
    console.error('Error ending study session:', error);
    throw error;
  }
};

/**
 * Get weekly study statistics
 * @param {number} weekNumber - Optional week number
 * @param {number} year - Optional year
 * @returns {Promise<Object>} - Weekly statistics
 */
export const getWeeklyStats = async (weekNumber, year) => {
  try {
    let url = '/api/study-time/weekly';
    const params = new URLSearchParams();
    
    if (weekNumber) params.append('weekNumber', weekNumber);
    if (year) params.append('year', year);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    throw error;
  }
};

/**
 * Get historical study statistics
 * @param {number} weekCount - Number of weeks to retrieve (default: 4)
 * @returns {Promise<Object>} - Historical statistics
 */
export const getHistoricalStats = async (weekCount = 4) => {
  try {
    const response = await api.get(`/api/study-time/historical?weekCount=${weekCount}`);
    return response.data;
  } catch (error) {
    console.error('Error getting historical stats:', error);
    throw error;
  }
};

/**
 * Format minutes into a readable time string
 * @param {number} minutes - Total minutes
 * @returns {string} - Formatted time string (e.g., "2h 30min")
 */
export const formatStudyTime = (minutes) => {
  if (!minutes) return '0h 0min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}h ${mins}min`;
};

/**
 * Track study time for a content view component
 * This function handles both starting and ending a session
 * @param {string} contentType - Type of content (course, test, formation)
 * @param {string} contentId - ID of the content
 * @returns {Object} - Functions to control the session
 */
export const useStudyTimeTracking = (contentType, contentId) => {
  let sessionData = null;
  let sessionInterval = null;
  
  // Start tracking when the component mounts
  const startTracking = async () => {
    try {
      const response = await startStudySession(contentType, contentId);
      
      if (response.success) {
        sessionData = response.data;
        console.log('Study session started:', sessionData._id);
        
        // Set up a ping interval to keep the session alive
        sessionInterval = setInterval(() => {
          console.log('Study session active:', sessionData._id);
        }, 60000); // Ping every minute
      }
      
      return sessionData;
    } catch (error) {
      console.error('Failed to start study tracking:', error);
      return null;
    }
  };
  
  // End tracking when the component unmounts
  const endTracking = async (completed = false) => {
    if (sessionInterval) {
      clearInterval(sessionInterval);
      sessionInterval = null;
    }
    
    if (sessionData) {
      try {
        const response = await endStudySession(sessionData._id, completed);
        console.log('Study session ended:', response.data);
        sessionData = null;
        return response.data;
      } catch (error) {
        console.error('Failed to end study tracking:', error);
      }
    }
    
    return null;
  };
  
  return {
    startTracking,
    endTracking,
    getSessionData: () => sessionData
  };
};
