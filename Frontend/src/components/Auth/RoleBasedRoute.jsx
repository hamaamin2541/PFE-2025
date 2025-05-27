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

  // Get user role from both possible sources
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRoleFromStorage = localStorage.getItem('userRole');
  const userRole = user.role || userRoleFromStorage;

  // Check if user has the required role
  const hasAllowedRole = allowedRoles.includes(userRole);

  if (!hasAllowedRole) {
    console.log('User role:', userRole, 'not in allowed roles:', allowedRoles);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
