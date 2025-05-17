import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, api } from '../config/api';

const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
  const [gamificationData, setGamificationData] = useState({
    points: 0,
    badges: [],
    streak: {
      currentStreak: 0,
      highestStreak: 0,
      lastActivity: null
    },
    isLoading: true,
    error: null
  });

  const fetchGamificationData = async () => {
    try {
      setGamificationData(prev => ({ ...prev, isLoading: true, error: null }));

      // Get token and log it for debugging
      const token = localStorage.getItem('token');
      console.log('Gamification: Token exists:', !!token);
      if (token) {
        console.log('Gamification: Token length:', token.length);
        console.log('Gamification: Token starts with:', token.substring(0, 10) + '...');
      }

      // Use our custom api instance which handles cancellations and errors
      console.log('Gamification: Making API request to /api/gamification/user');
      const response = await api.get(`${API_BASE_URL}/api/gamification/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Gamification: API response received:', response.status);

      // Check if we got mock data due to cancellation or network error
      if (response.data.isMockData || !response.data.success) {
        console.log('Using mock gamification data:', response.data.message || 'API error');
        setGamificationData({
          points: 100, // Default mock points
          badges: [
            {
              badgeId: 'mock-badge-1',
              name: 'Premier pas',
              description: 'Vous avez commencé votre parcours d\'apprentissage',
              icon: 'award',
              earnedAt: new Date().toISOString()
            }
          ],
          streak: {
            currentStreak: 1,
            highestStreak: 1,
            lastActivity: new Date().toISOString()
          },
          isLoading: false,
          error: null
        });
        return;
      }

      if (response.data.success) {
        console.log('Gamification: Successful response with data:', response.data);
        setGamificationData({
          points: response.data.data.points || 0,
          badges: response.data.data.badges || [],
          streak: response.data.data.streak || {
            currentStreak: 0,
            highestStreak: 0,
            lastActivity: null
          },
          isLoading: false,
          error: null
        });
      } else {
        console.error('Gamification: API returned success=false:', response.data);
        throw new Error('Failed to fetch gamification data');
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);

      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Gamification error response data:', error.response.data);
        console.error('Gamification error response status:', error.response.status);
        console.error('Gamification error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Gamification error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Gamification error message:', error.message);
      }

      // Don't log canceled requests as errors
      if (axios.isCancel(error)) {
        console.log('Gamification data request canceled');
        return;
      }

      // Use mock data on error
      setGamificationData({
        points: 100, // Default mock points
        badges: [
          {
            badgeId: 'mock-badge-1',
            name: 'Premier pas',
            description: 'Vous avez commencé votre parcours d\'apprentissage',
            icon: 'award',
            earnedAt: new Date().toISOString()
          }
        ],
        streak: {
          currentStreak: 1,
          highestStreak: 1,
          lastActivity: new Date().toISOString()
        },
        isLoading: false,
        error: error.message || 'Failed to fetch gamification data'
      });
    }
  };

  // Fetch gamification data on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('GamificationContext: Token exists in localStorage:', !!token);

    if (token) {
      // Verify token format
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('GamificationContext: Invalid token format, not a valid JWT');
          setGamificationData(prev => ({
            ...prev,
            isLoading: false,
            error: 'Invalid token format'
          }));
          return;
        }

        // Try to decode the token payload (for debugging only)
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('GamificationContext: Token payload:', payload);
          console.log('GamificationContext: Token expiry:', new Date(payload.exp * 1000).toLocaleString());

          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.error('GamificationContext: Token is expired');
            setGamificationData(prev => ({
              ...prev,
              isLoading: false,
              error: 'Token expired'
            }));
            return;
          }
        } catch (e) {
          console.warn('GamificationContext: Could not decode token payload:', e);
        }

        // Token looks valid, fetch data
        fetchGamificationData();
      } catch (e) {
        console.error('GamificationContext: Error processing token:', e);
        setGamificationData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error processing token'
        }));
      }
    } else {
      console.log('GamificationContext: No token found, using mock data');
      setGamificationData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Not authenticated',
        // Use mock data when not authenticated
        points: 100,
        badges: [
          {
            badgeId: 'mock-badge-1',
            name: 'Premier pas',
            description: 'Vous avez commencé votre parcours d\'apprentissage',
            icon: 'award',
            earnedAt: new Date().toISOString()
          }
        ],
        streak: {
          currentStreak: 1,
          highestStreak: 1,
          lastActivity: new Date().toISOString()
        }
      }));
    }
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        ...gamificationData,
        refreshGamificationData: fetchGamificationData
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => useContext(GamificationContext);
