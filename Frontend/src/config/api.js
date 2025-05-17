import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5001';

// Create a custom axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    // Check if this is an API request that might need authentication
    const isApiRequest = config.url.startsWith('/api/');
    const isPublicEndpoint =
      config.url.includes('/api/auth/login') ||
      config.url.includes('/api/auth/register') ||
      config.url.includes('/api/gamification/test');

    if (token) {
      // Verify token format
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('API: Invalid token format in localStorage, not a valid JWT');
          // If this is a protected endpoint, we should warn about the invalid token
          if (isApiRequest && !isPublicEndpoint) {
            console.warn('API: Request to protected endpoint with invalid token:', config.url);
          }
        } else {
          // Token format looks valid, add it to the request
          config.headers['Authorization'] = `Bearer ${token}`;

          // Add extra logging for gamification endpoints
          if (config.url.includes('/api/gamification')) {
            console.log('API Request to gamification endpoint:', config.url);
            console.log('API Request headers:', JSON.stringify(config.headers));
          }
        }
      } catch (e) {
        console.error('API: Error processing token:', e);
      }
    } else if (isApiRequest && !isPublicEndpoint) {
      // No token but trying to access a protected endpoint
      console.warn('API: No token found for request to protected endpoint:', config.url);
    }

    return config;
  },
  error => {
    console.error('API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Don't log canceled requests as errors
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.resolve({
        data: {
          success: true,
          data: [],
          isMockData: true,
          message: 'Request was canceled, using mock data'
        }
      });
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.warn('Network error, using mock data');
      return Promise.resolve({
        data: {
          success: true,
          data: [],
          isMockData: true,
          message: 'Network error, using mock data'
        }
      });
    }

    // Handle errors for gamification endpoints
    if (error.response && error.config.url.includes('/api/gamification')) {
      console.warn(`Gamification API error: ${error.response.status} - ${error.response.statusText}`);
      console.warn('Gamification API error details:', error.response.data);
      console.warn('Gamification API request URL:', error.config.url);
      console.warn('Gamification API request headers:', JSON.stringify(error.config.headers));

      // For 401 errors, check if token exists
      if (error.response.status === 401) {
        const token = localStorage.getItem('token');
        console.warn('Auth token exists:', !!token);
        if (token) {
          console.warn('Token length:', token.length);
          console.warn('Token starts with:', token.substring(0, 10) + '...');
        }
      }

      return Promise.resolve({
        data: {
          success: true,
          data: [],
          isMockData: true,
          message: `Gamification API error: ${error.response.status} - ${error.response.statusText}`
        }
      });
    }

    return Promise.reject(error);
  }
);
