/**
 * @fileoverview Customer bookings page - view booking history
 * @module pages/CustomerBookingsPage
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './CustomerBookingsPage.css';

const CustomerBookingsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchBookings();
    }
  }, [user, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/bookings/my-bookings?${params.toString()}`);
      setBookings(response.data.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      showNotification('Booking cancelled successfully', 'success');
      fetchBookings();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to cancel booking';
      showNotification(errorMsg, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const canCancel = (status) => {
    return ['pending', 'approved'].includes(status);
  };

  if (user?.role !== 'customer') {
    return <div className="customer-only">Customer access required</div>;
  }

  if (loading && bookings.length === 0) {
    return <Loader />;
  }

  return (
    <div className="customer-bookings-page">
      <div className="page-header">
        <h1>My Bookings</h1>
        <Link to="/customer/rooms" className="btn-primary">
          Make New Booking
        </Link>
      </div>

      <div className="filters-section">
        <div className="form-group">
          <label>Filter by Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          className="btn-clear"
          onClick={() => setFilters({ status: '' })}
        >
          Clear Filter
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-grid">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found.</p>
            <Link to="/customer/rooms" className="btn-primary">
              Browse Available Rooms
            </Link>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id || booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-id">
                  Booking #{String(booking._id || booking.id).slice(-8)}
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Room:</span>
                  <span className="detail-value">
                    {booking.room?.code || 'N/A'} ({booking.room?.type || 'N/A'})
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Check-in:</span>
                  <span className="detail-value">{formatDate(booking.checkInDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Check-out:</span>
                  <span className="detail-value">{formatDate(booking.checkOutDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nights:</span>
                  <span className="detail-value">{booking.totalNights}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value amount">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="booking-actions">
                {canCancel(booking.status) && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking._id || booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
                <Link
                  to={`/customer/payments?bookingId=${booking._id || booking.id}`}
                  className="btn-view-payments"
                >
                  View Payments
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerBookingsPage;

