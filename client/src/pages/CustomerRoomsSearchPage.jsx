/**
 * @fileoverview Customer room search page with filters
 * @module pages/CustomerRoomsSearchPage
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import { getRoomImage, getRoomDescription } from '../utils/roomImages';
import '../styles/Theme.css';
import './CustomerRoomsSearchPage.css';

const CustomerRoomsSearchPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingRoomId, setBookingRoomId] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    amenities: '',
    checkInDate: '',
    checkOutDate: '',
  });

  useEffect(() => {
    searchRooms();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const searchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.amenities) params.append('amenities', filters.amenities);
      if (filters.checkInDate) params.append('checkInDate', filters.checkInDate);
      if (filters.checkOutDate)
        params.append('checkOutDate', filters.checkOutDate);

      const response = await api.get(`/rooms?${params.toString()}`);
      setRooms(response.data.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchRooms();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      amenities: '',
      checkInDate: '',
      checkOutDate: '',
    });
    setTimeout(() => {
      searchRooms();
    }, 100);
  };

  const checkAvailability = async () => {
    if (!filters.checkInDate || !filters.checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(
        `/rooms/availability?checkInDate=${filters.checkInDate}&checkOutDate=${filters.checkOutDate}`
      );
      const availableRooms = response.data.data.availableRooms || [];
      setRooms(availableRooms);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = async (roomId) => {
    if (!filters.checkInDate || !filters.checkOutDate) {
      setError('Please select check-in and check-out dates before booking');
      return;
    }

    setError('');
    setSuccessMessage('');
    setBookingRoomId(roomId);

    try {
      await api.post('/bookings', {
        roomId,
        checkInDate: filters.checkInDate,
        checkOutDate: filters.checkOutDate,
      });

      setSuccessMessage(
        'Booking request submitted! You can view it under My Bookings.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingRoomId(null);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">search rooms</h1>
          <p className="page-subtitle">check availability & book a room.</p>
        </div>
        <div className="page-actions">
          <Link className="btn-secondary" to="/customer/dashboard">
            back to dashboard
          </Link>
        </div>
      </header>

      <section className="page-content">
        <div className="card">
          <div className="card-header">Search Filters</div>
          <div className="card-body">
        <form onSubmit={handleSearch}>
          <div className="filters-grid">
            <div className="form-group">
              <label>Room Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
              </select>
            </div>

            <div className="form-group">
              <label>Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
                step="0.01"
                placeholder="No limit"
              />
            </div>

            <div className="form-group">
              <label>Amenities (comma-separated)</label>
              <input
                type="text"
                name="amenities"
                value={filters.amenities}
                onChange={handleFilterChange}
                placeholder="e.g., WiFi, TV, AC"
              />
            </div>

            <div className="form-group">
              <label>Check-in Date</label>
              <input
                type="date"
                name="checkInDate"
                value={filters.checkInDate}
                onChange={handleFilterChange}
                min={today}
              />
            </div>

            <div className="form-group">
              <label>Check-out Date</label>
              <input
                type="date"
                name="checkOutDate"
                value={filters.checkOutDate}
                onChange={handleFilterChange}
                min={filters.checkInDate || today}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary">
              Search Rooms
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={checkAvailability}
              disabled={!filters.checkInDate || !filters.checkOutDate}
            >
              Check Availability
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {loading ? (
          <Loader />
        ) : (
          <div className="card">
            <div className="card-header">Available Rooms ({rooms.length})</div>
            <div className="card-body">
              {rooms.length === 0 ? (
                <div className="empty-state">
                  <p>No rooms found matching your criteria.</p>
                  <p>Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
                  {rooms.map((room) => (
                    <div key={room._id || room.id} className="card">
                      <div className="card-body">
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#0b1b2a' }}>{room.code}</h3>
                            <span style={{ 
                              padding: '6px 10px', 
                              borderRadius: '8px', 
                              fontSize: '12px', 
                              fontWeight: 800, 
                              textTransform: 'capitalize',
                              background: room.status === 'available' ? 'rgba(39,174,96,0.16)' : room.status === 'booked' ? 'rgba(243,156,18,0.16)' : 'rgba(231,76,60,0.16)',
                              color: room.status === 'available' ? '#27ae60' : room.status === 'booked' ? '#f39c12' : '#e74c3c'
                            }}>
                              {room.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            <p style={{ margin: '4px 0' }}><strong>Type:</strong> {room.type}</p>
                            <p style={{ margin: '4px 0' }}><strong>Price:</strong> {formatCurrency(room.pricePerNight)}/night</p>
                            <p style={{ margin: '4px 0' }}><strong>Max Guests:</strong> {room.maxGuests}</p>
                            {room.amenities && room.amenities.length > 0 && (
                              <div style={{ marginTop: '8px' }}>
                                <strong>Free Amenities:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                  {room.amenities.slice(0, 4).map((amenity, index) => (
                                    <span key={index} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(212,175,55,0.16)', fontSize: '12px' }}>{amenity}</span>
                                  ))}
                                  {room.amenities.length > 4 && (
                                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(212,175,55,0.16)', fontSize: '12px' }}>+{room.amenities.length - 4} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleBookRoom(room._id || room.id)}
                            disabled={bookingRoomId === (room._id || room.id) || room.status !== 'available'}
                            style={{ width: '100%' }}
                          >
                            {bookingRoomId === (room._id || room.id)
                              ? 'Booking...'
                              : room.status === 'available'
                              ? 'Book Now'
                              : 'Not Available'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerRoomsSearchPage;

