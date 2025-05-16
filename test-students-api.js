// Simple script to test the students API endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001'; // Updated to match the frontend config

async function testGetStudents() {
  try {
    console.log('Testing GET /api/users/byRole/student endpoint...');
    const response = await axios.get(`${API_BASE_URL}/api/users/byRole/student`);
    
    if (response.data.success) {
      console.log('Success! Received students data:');
      console.log(`Total students: ${response.data.data.length}`);
      console.log('First few students:');
      console.log(JSON.stringify(response.data.data.slice(0, 3), null, 2));
    } else {
      console.error('API returned success: false');
      console.error(response.data);
    }
  } catch (error) {
    console.error('Error testing API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testGetStudents();
