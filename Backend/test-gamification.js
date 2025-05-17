// Simple script to test the gamification API
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

// Test the gamification API
async function testGamificationAPI() {
  try {
    console.log('Testing gamification API...');

    // Test the public endpoint
    console.log('\nTesting public endpoint:');
    const publicResponse = await axios.get(`${API_BASE_URL}/api/gamification/test`);
    console.log('Public endpoint response:', publicResponse.data);

    // Try to get user data without authentication
    console.log('\nTesting user endpoint without auth:');
    try {
      const noAuthResponse = await axios.get(`${API_BASE_URL}/api/gamification/user`);
      console.log('User endpoint response (no auth):', noAuthResponse.data);
    } catch (error) {
      console.log('Error accessing user endpoint without auth (expected):', error.response?.status, error.response?.data);
    }

    // Get a token (you would need to replace these with valid credentials)
    console.log('\nGetting authentication token:');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'admin@welearn.com',
        password: 'Hama@Hama1*'
      });

      const token = authResponse.data.token;
      console.log('Authentication successful, token received');

      // Test with authentication
      console.log('\nTesting user endpoint with auth:');
      const authConfig = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const userResponse = await axios.get(`${API_BASE_URL}/api/gamification/user`, authConfig);
      console.log('User endpoint response (with auth):', userResponse.data);

    } catch (error) {
      console.log('Authentication error:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testGamificationAPI();
