/**
 * @fileoverview Protected route component for role-based access control
 * @module components/ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Token presence is the real gate (user may hydrate a moment later)
  const token = localStorage.getItem('accessToken');
  const isAuthed = !!token;

  if (loading) return <Loader />;

  // No token => must login
  if (!isAuthed) return <Navigate to="/login" replace />;

  // Token আছে কিন্তু user এখনো hydrate হয়নি => allow render, child can show loader if needed
  if (!user) return <Loader />;

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;