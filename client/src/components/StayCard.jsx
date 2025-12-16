/**
 * @fileoverview Stay card component to display booking details
 * @module components/StayCard
 */

import React from 'react';
import formatCurrency from '../utils/formatCurrency';
import './StayCard.css';

const StayCard = ({ booking, onClose }) => {
  if (!booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="stay-card-overlay" onClick={onClose}>
      <div className="stay-card" onClick={(e) => e.stopPropagation()}>
        <div className="stay-card-header">
          <h2>Stay Card</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="stay-card-content">
          <div className="stay-card-section">
            <h3>Booking Information</h3>
            <div className="info-row">
              <span className="label">Booking ID:</span>
              <span className="value">
                {(booking._id || booking.id).toString().slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span
                className={`status-badge status-${booking.status?.replace('_', '-')}`}
              >
                {booking.status?.replace('_', ' ').toUpperCase() || 'N/A'}
              </span>
            </div>
          </div>

          <div className="stay-card-section">
            <h3>Guest Information</h3>
            <div className="info-row">
              <span className="label">Name:</span>
              <span className="value">
                {booking.guest?.name || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">
                {booking.guest?.email || 'N/A'}
              </span>
            </div>
          </div>

          <div className="stay-card-section">
            <h3>Room Information</h3>
            <div className="info-row">
              <span className="label">Room Code:</span>
              <span className="value">
                {booking.room?.code || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Room Type:</span>
              <span className="value">
                {booking.room?.type?.toUpperCase() || 'N/A'}
              </span>
            </div>
            {booking.room?.amenities && booking.room.amenities.length > 0 && (
              <div className="info-row">
                <span className="label">Amenities:</span>
                <span className="value">
                  {booking.room.amenities.join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="stay-card-section">
            <h3>Stay Details</h3>
            <div className="info-row">
              <span className="label">Check-in:</span>
              <span className="value">
                {formatDate(booking.checkInDate)}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Check-out:</span>
              <span className="value">
                {formatDate(booking.checkOutDate)}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Nights:</span>
              <span className="value">{booking.totalNights}</span>
            </div>
            <div className="info-row">
              <span className="label">Total Amount:</span>
              <span className="value amount">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StayCard;

