/**
 * @fileoverview Admin bookings management page
 * @module pages/AdminBookingsPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './AdminBookingsPage.css';

const AdminBookingsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    checkInDate: '',
    checkOutDate: '',
    roomId: '',
  });
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user && ['admin', 'staff'].includes(user.role)) {
      fetchBookings();
    }
  }, [user, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.checkInDate) params.append('checkInDate', filters.checkInDate);
      if (filters.checkOutDate) params.append('checkOutDate', filters.checkOutDate);
      if (filters.roomId) params.append('roomId', filters.roomId);

      const response = await api.get(`/bookings?${params.toString()}`);
      setBookings(response.data.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      showNotification('Booking cancelled successfully', 'success');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel booking', 'error');
    }
  };

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

  if (!user || !['admin', 'staff'].includes(user.role)) {
    return <div className="admin-only">Admin/Staff access required</div>;
  }

  if (loading && bookings.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-bookings-page">
      <div className="page-header">
        <h1>Bookings Management</h1>
      </div>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Status</label>
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
          <div className="form-group">
            <label>Check-in From</label>
            <input
              type="date"
              value={filters.checkInDate}
              onChange={(e) => setFilters({ ...filters, checkInDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Check-out To</label>
            <input
              type="date"
              value={filters.checkOutDate}
              onChange={(e) => setFilters({ ...filters, checkOutDate: e.target.value })}
            />
          </div>
          <button
            className="btn-clear"
            onClick={() => setFilters({ status: '', checkInDate: '', checkOutDate: '', roomId: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Nights</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking._id || booking.id}>
                  <td>
                    <div>
                      <strong>{booking.guest?.name || 'N/A'}</strong>
                      <div className="guest-email">{booking.guest?.email || ''}</div>
                    </div>
                  </td>
                  <td>
                    Room {booking.room?.code || 'N/A'}
                    <div className="room-type">{booking.room?.type || ''}</div>
                  </td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td>{formatDate(booking.checkOutDate)}</td>
                  <td>{booking.totalNights || 0}</td>
                  <td>{formatCurrency(booking.totalAmount || 0)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ color: getStatusColor(booking.status) }}
                    >
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        View
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelBooking(booking._id || booking.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Guest:</strong> {selectedBooking.guest?.name} ({selectedBooking.guest?.email})
              </div>
              <div className="detail-row">
                <strong>Room:</strong> {selectedBooking.room?.code} ({selectedBooking.room?.type})
              </div>
              <div className="detail-row">
                <strong>Check-in:</strong> {formatDate(selectedBooking.checkInDate)}
              </div>
              <div className="detail-row">
                <strong>Check-out:</strong> {formatDate(selectedBooking.checkOutDate)}
              </div>
              <div className="detail-row">
                <strong>Total Nights:</strong> {selectedBooking.totalNights}
              </div>
              <div className="detail-row">
                <strong>Total Amount:</strong> {formatCurrency(selectedBooking.totalAmount || 0)}
              </div>
              <div className="detail-row">
                <strong>Status:</strong>{' '}
                <span style={{ color: getStatusColor(selectedBooking.status) }}>
                  {selectedBooking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <strong>Created:</strong> {formatDate(selectedBooking.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;

