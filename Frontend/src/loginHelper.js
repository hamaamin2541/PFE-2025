// Helper script to log in as admin
// Run this in your browser console

async function loginAsAdmin() {
  try {
    // Get API URL from the current page or use default
    const API_BASE_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:5001'
      : window.location.origin.replace(/:\d+$/, ':5001');

    // Prompt for admin credentials
    const email = prompt('Enter admin email:', 'admin@welearn.com');
    if (!email) {
      console.log('Login cancelled');
      return;
    }

    const password = prompt('Enter admin password:');
    if (!password) {
      console.log('Login cancelled');
      return;
    }

    const credentials = { email, password };

    console.log('Attempting to log in as admin...');

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.success && data.token) {
      // Store auth data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login successful!');
      console.log('User role:', data.user.role);
      console.log('Token:', data.token.substring(0, 20) + '...');

      // Redirect to admin dashboard
      window.location.href = '/admin/dashboard';
    } else {
      console.error('Login response did not contain expected data');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Execute the function
loginAsAdmin();
