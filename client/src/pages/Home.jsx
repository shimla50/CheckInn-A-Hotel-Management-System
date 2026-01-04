/**
 * @fileoverview Public home page displaying available rooms
 * @module pages/Home
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import { getRoomImage, getRoomDescription } from '../utils/roomImages';
import './Home.css';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/rooms?status=available');
      setRooms(response.data.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to CheckInn</h1>
        <p className="hero-subtitle">Your perfect stay awaits</p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">
            Book Now
          </Link>
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>
      </div>

      <div className="rooms-section">
        <div className="section-header">
          <h2>Available Rooms</h2>
          <p>Discover our comfortable and well-appointed accommodations</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <Loader />
        ) : (
          <>
            {rooms.length === 0 ? (
              <div className="empty-state">
                <p>No rooms available at the moment.</p>
                <p>Please check back later.</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <div key={room._id || room.id} className="room-card">
                    <div className="room-image-container">
                      <img 
                        src={getRoomImage(room)} 
                        alt={`${room.type} room ${room.code}`}
                        className="room-image"
                        loading="lazy"
                      />
                      <span className={`status-badge status-${room.status}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="room-content">
                      <div className="room-header">
                        <h3>Room {room.code}</h3>
                        <span className="room-type-badge">{room.type}</span>
                      </div>
                      <p className="room-description">
                        {room.description || getRoomDescription(room.type)}
                      </p>
                      <div className="room-details">
                        <div className="room-detail-item">
                          <span className="detail-icon">👥</span>
                          <span>{room.maxGuests} {room.maxGuests === 1 ? 'Guest' : 'Guests'}</span>
                        </div>
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="amenities-list">
                            {room.amenities.slice(0, 3).map((amenity, index) => (
                              <span key={index} className="amenity-tag">{amenity}</span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="amenity-tag">+{room.amenities.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="room-footer">
                        <div className="room-price">
                          <span className="price-amount">{formatCurrency(room.pricePerNight)}</span>
                          <span className="price-period">/night</span>
                        </div>
                        <Link
                          to="/register"
                          className="btn-book"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;

