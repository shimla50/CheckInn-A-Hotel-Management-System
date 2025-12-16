/**
 * @fileoverview Protected route component for role-based access control
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * ProtectedRoute component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Array of allowed roles (optional)
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = `/${user.role}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default ProtectedRoute;

