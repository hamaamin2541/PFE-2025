// Simple script to check admin login status
// Run this in your browser console

function checkAdminStatus() {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('User role:', userRole);
  console.log('User data:', user ? JSON.parse(user) : null);
  
  return {
    isLoggedIn: !!token,
    isAdmin: userRole === 'admin',
    userData: user ? JSON.parse(user) : null
  };
}

// Execute the function
const status = checkAdminStatus();
console.log('Login status:', status);

// If not logged in as admin, try logging in with default admin credentials
if (!status.isLoggedIn || !status.isAdmin) {
  console.log('Not logged in as admin. You should try logging in with:');
  console.log('Email: admin@welearn.com');
  console.log('Password: Hama@Hama1*');
}
