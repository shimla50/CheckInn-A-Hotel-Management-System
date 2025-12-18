/**
 * @fileoverview Customer feedback page - submit and view own feedback
 * @module pages/CustomerFeedbackPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './CustomerFeedbackPage.css';

const CustomerFeedbackPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [feedbacks, setFeedbacks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    bookingId: '',
  });

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchFeedbacks();
      fetchBookings();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedback/my-feedback');
      setFeedbacks(response.data.data.feedbacks || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const feedbackData = {
        rating: Number(formData.rating),
        comment: formData.comment.trim(),
        bookingId: formData.bookingId || undefined,
      };

      await api.post('/feedback', feedbackData);

      const successText = 'Feedback submitted successfully!';
      showNotification(successText, 'success');
      setSuccessMessage(successText);
      setShowForm(false);
      setFormData({
        rating: 5,
        comment: '',
        bookingId: '',
      });
      fetchFeedbacks();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit feedback';
      setError(errorMsg);
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

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (user?.role !== 'customer') {
    return <div className="customer-only">Customer access required</div>;
  }

  if (loading && feedbacks.length === 0) {
    return <Loader />;
  }

  return (
    <div className="customer-feedback-page">
      <div className="page-header">
        <h1>My Feedback</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          Submit Feedback
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {showForm && (
        <div className="feedback-form-card">
          <h2>Submit Feedback</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="star-label">
                    <input
                      type="radio"
                      name="rating"
                      value={star}
                      checked={formData.rating === star}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="star">★</span>
                  </label>
                ))}
                <span className="rating-display">
                  {renderStars(Number(formData.rating))}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Booking (Optional)</label>
              <select
                name="bookingId"
                value={formData.bookingId}
                onChange={handleInputChange}
              >
                <option value="">Select a booking (optional)</option>
                {bookings
                  .filter((b) => b.status !== 'cancelled')
                  .map((booking) => (
                    <option key={booking._id || booking.id} value={booking._id || booking.id}>
                      Room {booking.room?.code} - {formatDate(booking.checkInDate)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Comment</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                rows="5"
                placeholder="Share your experience..."
                maxLength={1000}
              />
              <div className="char-count">
                {formData.comment.length}/1000 characters
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Submit Feedback
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    rating: 5,
                    comment: '',
                    bookingId: '',
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="feedbacks-list">
        <h2>My Feedback History</h2>
        {feedbacks.length === 0 ? (
          <div className="empty-state">
            <p>You haven't submitted any feedback yet.</p>
            <p>Share your experience to help us improve!</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback._id || feedback.id} className="feedback-card">
              <div className="feedback-header">
                <div className="feedback-rating">
                  <span className="stars">{renderStars(feedback.rating)}</span>
                  <span className="rating-number">({feedback.rating}/5)</span>
                </div>
                <div className="feedback-date">
                  {formatDate(feedback.createdAt)}
                </div>
              </div>

              {feedback.booking && (
                <div className="feedback-booking">
                  <strong>Booking:</strong> Room {feedback.booking.room?.code || 'N/A'} -{' '}
                  {formatDate(feedback.booking.checkInDate)}
                </div>
              )}

              {feedback.comment && (
                <div className="feedback-comment">
                  <p>{feedback.comment}</p>
                </div>
              )}

              {feedback.responseFromStaff && (
                <div className="feedback-response">
                  <div className="response-header">
                    <strong>Response from Staff:</strong>
                  </div>
                  <p>{feedback.responseFromStaff}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerFeedbackPage;

