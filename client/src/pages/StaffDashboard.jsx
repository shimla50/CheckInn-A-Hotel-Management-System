/**
 * @fileoverview Staff dashboard page
 * @module pages/StaffDashboard
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './Dashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState({
    checkInsToday: 0,
    checkOutsToday: 0,
    pendingBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/staff/tasks-today');
        setTasks(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load today\'s tasks');
        console.error('Error fetching staff tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchTasks();
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Staff Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Staff Features</h2>
          <ul className="feature-list">
            <li>
              <Link to="/staff/bookings">Manage bookings and reservations</Link>
            </li>
            <li>
              <Link to="/staff/front-desk">Check-in and check-out guests</Link>
            </li>
            <li>
              <Link to="/customer/rooms">View room availability</Link>
            </li>
            <li>
              <Link to="/admin/feedback">Handle customer inquiries and feedback</Link>
            </li>
            <li>
              <Link to="/staff/services">Process additional services</Link>
            </li>
            <li>
              <Link to="/staff/bookings">View booking history</Link>
            </li>
            <li>
              <Link to="/staff/bookings">Update booking status</Link>
            </li>
            <li>
              <Link to="/staff/billing">Process payments and invoices</Link>
            </li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h2>Today's Tasks</h2>
          {loading ? (
            <div className="loading-state">
              <Loader />
              <p>Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : (
            <div className="task-list">
              <div className="task-item">
                <span className="task-label">Check-ins scheduled:</span>
                <span className="task-value">{tasks.checkInsToday}</span>
              </div>
              <div className="task-item">
                <span className="task-label">Check-outs scheduled:</span>
                <span className="task-value">{tasks.checkOutsToday}</span>
              </div>
              <div className="task-item">
                <span className="task-label">Pending bookings:</span>
                <span className="task-value">{tasks.pendingBookings}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
