/**
 * @fileoverview Customer booking page - create bookings and view own bookings
 * @module pages/CustomerBookingPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './CustomerBookingPage.css';

const CustomerBookingPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: '',
  });

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchBookings();
      fetchAvailableRooms();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const bookingData = {
        roomId: formData.roomId,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests
          ? Number(formData.numberOfGuests)
          : undefined,
      };

      await api.post('/bookings', bookingData);
      setShowBookingForm(false);
      setFormData({
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: '',
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const updateData = {};
      if (formData.roomId) updateData.roomId = formData.roomId;
      if (formData.checkInDate) updateData.checkInDate = formData.checkInDate;
      if (formData.checkOutDate) updateData.checkOutDate = formData.checkOutDate;

      await api.put(`/bookings/${editingBooking.id}`, updateData);
      setShowBookingForm(false);
      setEditingBooking(null);
      setFormData({
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: '',
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking');
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
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleEdit = (booking) => {
    // Can only edit if status is pending or approved
    if (!['pending', 'approved'].includes(booking.status)) {
      setError('Cannot edit booking that is already checked in or checked out');
      return;
    }

    setEditingBooking({ id: booking._id || booking.id });
    setFormData({
      roomId: booking.room?._id || booking.room?.id || '',
      checkInDate: booking.checkInDate
        ? new Date(booking.checkInDate).toISOString().split('T')[0]
        : '',
      checkOutDate: booking.checkOutDate
        ? new Date(booking.checkOutDate).toISOString().split('T')[0]
        : '',
      numberOfGuests: '',
    });
    setShowBookingForm(true);
  };

  const handleCancelForm = () => {
    setShowBookingForm(false);
    setEditingBooking(null);
    setFormData({
      roomId: '',
      checkInDate: '',
      checkOutDate: '',
      numberOfGuests: '',
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

  const today = new Date().toISOString().split('T')[0];

  if (user?.role !== 'customer') {
    return <div className="customer-only">Customer access required</div>;
  }

  if (loading && bookings.length === 0) {
    return <Loader />;
  }

  return (
    <div className="customer-booking-page">
      <div className="page-header">
        <h1>My Bookings</h1>
        <button
          className="btn-primary"
          onClick={() => setShowBookingForm(true)}
          disabled={showBookingForm}
        >
          Create New Booking
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showBookingForm && (
        <div className="booking-form-card">
          <h2>{editingBooking ? 'Modify Booking' : 'Create New Booking'}</h2>
          <form
            onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking}
          >
            <div className="form-group">
              <label>Room *</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                required={!editingBooking}
              >
                <option value="">Select a room</option>
                {rooms
                  .filter((room) => room.status === 'available')
                  .map((room) => (
                    <option key={room._id || room.id} value={room._id || room.id}>
                      {room.code} - {room.type} (
                      {formatCurrency(room.pricePerNight)}/night, Max{' '}
                      {room.maxGuests} guests)
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Check-in Date *</label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleInputChange}
                  required={!editingBooking}
                  min={today}
                />
              </div>

              <div className="form-group">
                <label>Check-out Date *</label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleInputChange}
                  required={!editingBooking}
                  min={formData.checkInDate || today}
                />
              </div>
            </div>

            {!editingBooking && (
              <div className="form-group">
                <label>Number of Guests</label>
                <input
                  type="number"
                  name="numberOfGuests"
                  value={formData.numberOfGuests}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Optional"
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingBooking ? 'Update Booking' : 'Create Booking'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bookings-list">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any bookings yet.</p>
            <p>Create your first booking to get started!</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id || booking.id} className="booking-card">
              <div className="booking-header">
                <div>
                  <h3>Room {booking.room?.code || 'N/A'}</h3>
                  <p className="booking-type">
                    {booking.room?.type?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <span
                  className={`status-badge ${getStatusBadgeClass(booking.status)}`}
                >
                  {booking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
                </div>
                <div className="detail-item">
                  <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
                </div>
                <div className="detail-item">
                  <strong>Nights:</strong> {booking.totalNights}
                </div>
                <div className="detail-item">
                  <strong>Total Amount:</strong>{' '}
                  {formatCurrency(booking.totalAmount)}
                </div>
                {booking.room?.amenities && booking.room.amenities.length > 0 && (
                  <div className="detail-item">
                    <strong>Amenities:</strong>{' '}
                    {booking.room.amenities.join(', ')}
                  </div>
                )}
              </div>

              <div className="booking-actions">
                {['pending', 'approved'].includes(booking.status) && (
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(booking)}
                  >
                    Modify
                  </button>
                )}
                {booking.status !== 'checked_in' &&
                  booking.status !== 'checked_out' && (
                    <button
                      className="btn-cancel"
                      onClick={() =>
                        handleCancelBooking(booking._id || booking.id)
                      }
                    >
                      Cancel
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerBookingPage;

