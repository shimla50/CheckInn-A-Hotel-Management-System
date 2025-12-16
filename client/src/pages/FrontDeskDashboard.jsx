/**
 * @fileoverview Front desk dashboard for check-in/check-out operations
 * @module pages/FrontDeskDashboard
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import StayCard from '../components/StayCard';
import './FrontDeskDashboard.css';

const FrontDeskDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchOverview();
      // Refresh every 30 seconds
      const interval = setInterval(fetchOverview, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/front-desk/overview');
      setOverview(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch front desk overview');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      await api.post(`/bookings/${bookingId}/check-in`);
      await fetchOverview();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in guest');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (
      !window.confirm(
        'Are you sure you want to check out this guest? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      await api.post(`/bookings/${bookingId}/check-out`);
      await fetchOverview();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out guest');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user || !['staff', 'admin'].includes(user.role)) {
    return <div className="staff-only">Staff/Admin access required</div>;
  }

  if (loading && !overview) {
    return <Loader />;
  }

  return (
    <div className="front-desk-dashboard">
      <div className="page-header">
        <h1>Front Desk Dashboard</h1>
        <button className="btn-refresh" onClick={fetchOverview} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {overview && (
        <div className="overview-grid">
          {/* Today's Arrivals */}
          <div className="section-card arrivals-card">
            <div className="section-header">
              <h2>
                Today's Arrivals
                <span className="count-badge">{overview.arrivals.count}</span>
              </h2>
            </div>
            <div className="bookings-list">
              {overview.arrivals.bookings.length === 0 ? (
                <p className="empty-message">No arrivals scheduled for today</p>
              ) : (
                overview.arrivals.bookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className="booking-item"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="booking-main-info">
                      <div className="guest-name">
                        {booking.guest?.name || 'N/A'}
                      </div>
                      <div className="room-code">Room {booking.room?.code || 'N/A'}</div>
                    </div>
                    <div className="booking-details">
                      <div className="detail-item">
                        <span className="detail-label">Check-in:</span>
                        <span className="detail-value">
                          {formatDate(booking.checkInDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nights:</span>
                        <span className="detail-value">{booking.totalNights}</span>
                      </div>
                    </div>
                    <button
                      className="btn-check-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckIn(booking._id || booking.id);
                      }}
                      disabled={actionLoading[booking._id || booking.id]}
                    >
                      {actionLoading[booking._id || booking.id]
                        ? 'Processing...'
                        : 'Check In'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In-House Guests */}
          <div className="section-card in-house-card">
            <div className="section-header">
              <h2>
                In-House Guests
                <span className="count-badge">{overview.inHouse.count}</span>
              </h2>
            </div>
            <div className="bookings-list">
              {overview.inHouse.bookings.length === 0 ? (
                <p className="empty-message">No guests currently checked in</p>
              ) : (
                overview.inHouse.bookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className="booking-item"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="booking-main-info">
                      <div className="guest-name">
                        {booking.guest?.name || 'N/A'}
                      </div>
                      <div className="room-code">Room {booking.room?.code || 'N/A'}</div>
                    </div>
                    <div className="booking-details">
                      <div className="detail-item">
                        <span className="detail-label">Check-out:</span>
                        <span className="detail-value">
                          {formatDate(booking.checkOutDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nights:</span>
                        <span className="detail-value">{booking.totalNights}</span>
                      </div>
                    </div>
                    <button
                      className="btn-check-out"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckOut(booking._id || booking.id);
                      }}
                      disabled={actionLoading[booking._id || booking.id]}
                    >
                      {actionLoading[booking._id || booking.id]
                        ? 'Processing...'
                        : 'Check Out'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Departures */}
          <div className="section-card departures-card">
            <div className="section-header">
              <h2>
                Today's Departures
                <span className="count-badge">{overview.departures.count}</span>
              </h2>
            </div>
            <div className="bookings-list">
              {overview.departures.bookings.length === 0 ? (
                <p className="empty-message">No departures scheduled for today</p>
              ) : (
                overview.departures.bookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className="booking-item"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="booking-main-info">
                      <div className="guest-name">
                        {booking.guest?.name || 'N/A'}
                      </div>
                      <div className="room-code">Room {booking.room?.code || 'N/A'}</div>
                    </div>
                    <div className="booking-details">
                      <div className="detail-item">
                        <span className="detail-label">Check-out:</span>
                        <span className="detail-value">
                          {formatDate(booking.checkOutDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value amount">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-check-out"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckOut(booking._id || booking.id);
                      }}
                      disabled={actionLoading[booking._id || booking.id]}
                    >
                      {actionLoading[booking._id || booking.id]
                        ? 'Processing...'
                        : 'Check Out'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <StayCard
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default FrontDeskDashboard;

