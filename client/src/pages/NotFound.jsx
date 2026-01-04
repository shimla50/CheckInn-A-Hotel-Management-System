/**
 * @fileoverview 404 Not Found page
 * @module pages/NotFound
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotFound.css';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-message">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to={getDashboardPath()} className="not-found-link btn-primary">
            Go to Dashboard
          </Link>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginLeft: '12px' }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

