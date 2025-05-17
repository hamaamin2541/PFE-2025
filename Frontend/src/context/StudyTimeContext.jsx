import React, { createContext, useState, useContext, useEffect } from 'react';
import { getWeeklyStats, getHistoricalStats } from '../services/studyTimeService';

const StudyTimeContext = createContext();

export const StudyTimeProvider = ({ children }) => {
  const [studyStats, setStudyStats] = useState({
    weeklyStats: {
      userStats: {
        totalMinutes: 0,
        sessionsCount: 0,
        completedCount: 0,
        formattedTime: '0h 0min'
      },
      platformStats: {
        averageMinutes: 0,
        userCount: 0
      },
      percentile: 0
    },
    historicalStats: [],
    isLoading: true,
    error: null
  });

  const fetchWeeklyStats = async () => {
    try {
      setStudyStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await getWeeklyStats();
      
      if (response.success) {
        setStudyStats(prev => ({
          ...prev,
          weeklyStats: response.data,
          isLoading: false
        }));
      } else {
        throw new Error('Failed to fetch weekly study stats');
      }
    } catch (error) {
      console.error('Error fetching weekly study stats:', error);
      setStudyStats(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch weekly study stats'
      }));
    }
  };

  const fetchHistoricalStats = async (weekCount = 4) => {
    try {
      setStudyStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await getHistoricalStats(weekCount);
      
      if (response.success) {
        setStudyStats(prev => ({
          ...prev,
          historicalStats: response.data,
          isLoading: false
        }));
      } else {
        throw new Error('Failed to fetch historical study stats');
      }
    } catch (error) {
      console.error('Error fetching historical study stats:', error);
      setStudyStats(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch historical study stats'
      }));
    }
  };

  // Fetch study stats on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchWeeklyStats();
    } else {
      setStudyStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Not authenticated'
      }));
    }
  }, []);

  return (
    <StudyTimeContext.Provider
      value={{
        ...studyStats,
        refreshWeeklyStats: fetchWeeklyStats,
        fetchHistoricalStats
      }}
    >
      {children}
    </StudyTimeContext.Provider>
  );
};

export const useStudyTime = () => useContext(StudyTimeContext);
