import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../utils/authUtils';

/**
 * PrivateRoute component to protect routes that require authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Protected route
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    // Save the current location they were trying to go to
    return <Navigate to="/SeConnecter" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
