/**
 * @fileoverview Customer room search page with filters
 * @module pages/CustomerRoomsSearchPage
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
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
    <div className="customer-rooms-search-page">
      <div className="page-header">
        <h1>Search Rooms</h1>
      </div>

      <div className="search-filters-card">
        <h2>Search Filters</h2>
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

          <div className="filter-actions">
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
              className="btn-clear"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="results-header">
            <h2>Available Rooms ({rooms.length})</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms found matching your criteria.</p>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room._id || room.id} className="room-card">
                  <div className="room-header">
                    <h3>{room.code}</h3>
                    <span className={`status-badge status-${room.status}`}>
                      {room.status}
                    </span>
                  </div>
                  <div className="room-details">
                    <p className="room-type">
                      <strong>Type:</strong> {room.type}
                    </p>
                    <p className="room-price">
                      <strong>Price:</strong>{' '}
                      {formatCurrency(room.pricePerNight)}/night
                    </p>
                    <p>
                      <strong>Max Guests:</strong> {room.maxGuests}
                    </p>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="amenities-list">
                        <strong>Amenities:</strong>
                        <ul>
                          {room.amenities.map((amenity, index) => (
                            <li key={index}>{amenity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="room-actions">
                    <button
                      className="btn-book"
                      onClick={() => handleBookRoom(room._id || room.id)}
                      disabled={bookingRoomId === (room._id || room.id)}
                    >
                      {bookingRoomId === (room._id || room.id)
                        ? 'Booking...'
                        : 'Book Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerRoomsSearchPage;

