/**
 * @fileoverview Staff bookings dashboard - view and manage all bookings
 * @module pages/StaffBookingsDashboard
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './StaffBookingsDashboard.css';

const StaffBookingsDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    checkInDate: '',
    checkOutDate: '',
    roomId: '',
    guestId: '',
  });

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.checkInDate) params.append('checkInDate', filters.checkInDate);
      if (filters.checkOutDate) params.append('checkOutDate', filters.checkOutDate);
      if (filters.roomId) params.append('roomId', filters.roomId);
      if (filters.guestId) params.append('guestId', filters.guestId);

      const response = await api.get(`/bookings?${params.toString()}`);
      setBookings(response.data.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchBookings();
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApprove = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/approve`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleCancel = async (bookingId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      checkInDate: '',
      checkOutDate: '',
      roomId: '',
      guestId: '',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      approved: 'status-approved',
      checked_in: 'status-checked-in',
      checked_out: 'status-checked-out',
      cancelled: 'status-cancelled',
    };
    return statusMap[status] || '';
  };

  if (!user || !['staff', 'admin'].includes(user.role)) {
    return <div className="staff-only">Staff/Admin access required</div>;
  }

  if (loading && bookings.length === 0) {
    return <Loader />;
  }

  return (
    <div className="staff-bookings-dashboard">
      <div className="page-header">
        <h1>Bookings Management</h1>
      </div>

      <div className="filters-card">
        <h2>Filters</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Check-in Date (from)</label>
            <input
              type="date"
              name="checkInDate"
              value={filters.checkInDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>Check-out Date (to)</label>
            <input
              type="date"
              name="checkOutDate"
              value={filters.checkOutDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>Room ID</label>
            <input
              type="text"
              name="roomId"
              value={filters.roomId}
              onChange={handleFilterChange}
              placeholder="Room ID"
            />
          </div>

          <div className="form-group">
            <label>Guest ID</label>
            <input
              type="text"
              name="guestId"
              value={filters.guestId}
              onChange={handleFilterChange}
              placeholder="Guest ID"
            />
          </div>
        </div>

        <button className="btn-clear" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-table-container">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found matching your criteria.</p>
          </div>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Booking ID</th>
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
              {bookings.map((booking) => (
                <tr key={booking._id || booking.id}>
                  <td className="booking-id">
                    {(booking._id || booking.id).toString().slice(-8)}
                  </td>
                  <td>
                    <div className="guest-info">
                      <div>{booking.guest?.name || 'N/A'}</div>
                      <div className="guest-email">
                        {booking.guest?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{booking.room?.code || 'N/A'}</strong>
                    </div>
                    <div className="room-type">
                      {booking.room?.type?.toUpperCase() || 'N/A'}
                    </div>
                  </td>
                  <td>{formatDate(booking.checkInDate)}</td>
                  <td>{formatDate(booking.checkOutDate)}</td>
                  <td>{booking.totalNights}</td>
                  <td className="amount">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.status === 'pending' && (
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(booking._id || booking.id)}
                        >
                          Approve
                        </button>
                      )}
                      {booking.status !== 'checked_out' &&
                        booking.status !== 'cancelled' && (
                          <button
                            className="btn-cancel"
                            onClick={() =>
                              handleCancel(booking._id || booking.id)
                            }
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StaffBookingsDashboard;

