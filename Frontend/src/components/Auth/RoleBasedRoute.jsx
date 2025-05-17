import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../../utils/authUtils';

/**
 * RoleBasedRoute component to protect routes based on user role
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {React.ReactNode} props.children - Child components to render if authenticated and authorized
 * @param {string} [props.redirectPath='/'] - Path to redirect to if not authorized
 * @returns {React.ReactNode} - Role-protected route
 */
const RoleBasedRoute = ({ allowedRoles, children, redirectPath = '/' }) => {
  const location = useLocation();
  
  // First check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/SeConnecter" state={{ from: location }} replace />;
  }
  
  // Then check if user has the required role
  const hasAllowedRole = allowedRoles.some(role => hasRole(role));
  
  if (!hasAllowedRole) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default RoleBasedRoute;
