/**
 * @fileoverview Admin bookings management page
 * @module pages/AdminBookingsPage
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import '../styles/Theme.css';
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
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">bookings management</h1>
          <p className="page-subtitle">monitor reservations across the system.</p>
        </div>
        <div className="page-actions">
          <Link className="btn-secondary" to="/admin/dashboard">
            back to dashboard
          </Link>
        </div>
      </header>

      <section className="page-content">
        <div className="card">
          <div className="card-header">Filters</div>
          <div className="card-body">
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
            className="btn-secondary"
            onClick={() => setFilters({ status: '', checkInDate: '', checkOutDate: '', roomId: '' })}
          >
            Clear Filters
          </button>
        </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="card">
          <div className="card-body">
            <div className="table-container">
              <table className="table">
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
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        textTransform: 'capitalize',
                        background: booking.status === 'approved' ? 'rgba(39,174,96,0.16)' : 
                                    booking.status === 'checked_in' ? 'rgba(52,152,219,0.16)' :
                                    booking.status === 'checked_out' ? 'rgba(149,165,166,0.16)' :
                                    booking.status === 'cancelled' ? 'rgba(231,76,60,0.16)' :
                                    'rgba(243,156,18,0.16)',
                        color: booking.status === 'approved' ? '#27ae60' :
                               booking.status === 'checked_in' ? '#3498db' :
                               booking.status === 'checked_out' ? '#95a5a6' :
                               booking.status === 'cancelled' ? '#e74c3c' :
                               '#f39c12'
                      }}
                    >
                      {booking.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        onClick={() => setSelectedBooking(booking)}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                      >
                        View
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                        <button
                          className="btn-danger"
                          onClick={() => handleCancelBooking(booking._id || booking.id)}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
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
          </div>
        </div>

        {selectedBooking && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedBooking(null)}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Booking Details</h2>
                <button className="btn-secondary" onClick={() => setSelectedBooking(null)} style={{ fontSize: '20px', padding: '4px 12px' }}>
                  ×
                </button>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div><strong>Guest:</strong> {selectedBooking.guest?.name} ({selectedBooking.guest?.email})</div>
                  <div><strong>Room:</strong> {selectedBooking.room?.code} ({selectedBooking.room?.type})</div>
                  <div><strong>Check-in:</strong> {formatDate(selectedBooking.checkInDate)}</div>
                  <div><strong>Check-out:</strong> {formatDate(selectedBooking.checkOutDate)}</div>
                  <div><strong>Total Nights:</strong> {selectedBooking.totalNights}</div>
                  <div><strong>Total Amount:</strong> {formatCurrency(selectedBooking.totalAmount || 0)}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'capitalize',
                      background: selectedBooking.status === 'approved' ? 'rgba(39,174,96,0.16)' : 
                                  selectedBooking.status === 'checked_in' ? 'rgba(52,152,219,0.16)' :
                                  selectedBooking.status === 'checked_out' ? 'rgba(149,165,166,0.16)' :
                                  selectedBooking.status === 'cancelled' ? 'rgba(231,76,60,0.16)' :
                                  'rgba(243,156,18,0.16)',
                      color: selectedBooking.status === 'approved' ? '#27ae60' :
                             selectedBooking.status === 'checked_in' ? '#3498db' :
                             selectedBooking.status === 'checked_out' ? '#95a5a6' :
                             selectedBooking.status === 'cancelled' ? '#e74c3c' :
                             '#f39c12'
                    }}>
                      {selectedBooking.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div><strong>Created:</strong> {formatDate(selectedBooking.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminBookingsPage;

