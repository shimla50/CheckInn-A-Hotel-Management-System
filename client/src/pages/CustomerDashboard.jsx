/**
 * @fileoverview Customer dashboard page
 * @module pages/CustomerDashboard
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './Dashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/customer/my-bookings/summary');
        setBookings(res.data.data.bookings || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings');
        console.error('Error fetching customer bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'customer') {
      fetchBookings();
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#27ae60';
      case 'checked_in':
        return '#3498db';
      case 'checked_out':
        return '#95a5a6';
      case 'pending':
        return '#f39c12';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <p>Welcome, {user?.name}!</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Customer Features</h2>
          <ul className="feature-list">
            <li>
              <Link to="/customer/bookings">View your bookings</Link>
            </li>
            <li>
              <Link to="/customer/rooms">Make new bookings</Link>
            </li>
            <li>
              <Link to="/customer/bookings">View booking history</Link>
            </li>
            <li>
              <Link to="/customer/payments">View payment history</Link>
            </li>
            <li>
              <Link to="/customer/feedback">Leave feedback and ratings</Link>
            </li>
            <li>
              <Link to="/customer/bookings">Cancel bookings (if allowed)</Link>
            </li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h2>My Bookings</h2>
          {loading ? (
            <div className="loading-state">
              <Loader />
              <p>Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet. Start by making a reservation!</p>
            </div>
          ) : (
            <ul className="booking-list">
              {bookings.map((booking) => (
                <li key={booking._id} className="booking-item">
                  <div className="booking-header">
                    <div>
                      <strong>Room {booking.room?.number || 'N/A'}</strong>
                      <span className="room-type"> ({booking.room?.type || 'N/A'})</span>
                    </div>
                    <span
                      className="booking-status"
                      style={{ color: getStatusColor(booking.status) }}
                    >
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="booking-dates">
                    <span>
                      {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                  <div className="booking-amount">
                    Total: {formatCurrency(booking.totalAmount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
