/**
 * @fileoverview Admin dashboard page
 * @module pages/AdminDashboard
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    activeBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/admin/summary');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin summary');
        console.error('Error fetching admin summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSummary();
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Admin Features</h2>
          <ul className="feature-list">
            <li>
              <Link to="/admin/users">Manage all users (Admin, Staff, Customers)</Link>
            </li>
            <li>
              <Link to="/admin/rooms">Manage rooms and room types</Link>
            </li>
            <li>
              <Link to="/admin/bookings">View all bookings across the system</Link>
            </li>
            <li>
              <Link to="/admin/reports">Generate comprehensive reports</Link>
            </li>
            <li>
              <Link to="/admin/feedback">Handle customer feedback and responses</Link>
            </li>
            <li>
              <Link to="/admin/settings">System settings and configuration</Link>
            </li>
            <li>
              <Link to="/admin/staff">Manage staff accounts</Link>
            </li>
            <li>
              <Link to="/admin/payments">View payment transactions</Link>
            </li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h2>Quick Stats</h2>
          {loading ? (
            <div className="loading-state">
              <Loader />
              <p>Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalRooms}</div>
                <div className="stat-label">Total Rooms</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.activeBookings}</div>
                <div className="stat-label">Active Bookings</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                <div className="stat-label">Revenue</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
