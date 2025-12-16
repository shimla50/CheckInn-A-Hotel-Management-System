/**
 * @fileoverview Admin feedback management page
 * @module pages/AdminFeedbackManagement
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './AdminFeedbackManagement.css';

const AdminFeedbackManagement = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    rating: '',
    hasResponse: '',
    startDate: '',
    endDate: '',
  });
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchFeedbacks();
    }
  }, [user, filters]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.hasResponse) params.append('hasResponse', filters.hasResponse);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/feedback?${params.toString()}`);
      setFeedbacks(response.data.data.feedbacks || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      setError('Response cannot be empty');
      return;
    }

    try {
      await api.post(`/feedback/${feedbackId}/respond`, {
        response: responseText.trim(),
      });
      
      showNotification('Response added successfully!', 'success');
      setRespondingTo(null);
      setResponseText('');
      fetchFeedbacks();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add response';
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

  if (!user || !['staff', 'admin'].includes(user.role)) {
    return <div className="staff-only">Staff/Admin access required</div>;
  }

  if (loading && feedbacks.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-feedback-management">
      <div className="page-header">
        <h1>Feedback Management</h1>
      </div>

      <div className="filters-card">
        <h2>Filters</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Rating</label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="form-group">
            <label>Response Status</label>
            <select
              name="hasResponse"
              value={filters.hasResponse}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="true">With Response</option>
              <option value="false">Without Response</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <button className="btn-clear" onClick={() => setFilters({
          rating: '',
          hasResponse: '',
          startDate: '',
          endDate: '',
        })}>
          Clear Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="feedbacks-list">
        {feedbacks.length === 0 ? (
          <div className="empty-state">
            <p>No feedback found matching your criteria.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback._id || feedback.id} className="feedback-card">
              <div className="feedback-header">
                <div className="feedback-customer">
                  <strong>{feedback.customer?.name || 'N/A'}</strong>
                  <span className="customer-email">
                    {feedback.customer?.email || ''}
                  </span>
                </div>
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

              {feedback.responseFromStaff ? (
                <div className="feedback-response">
                  <div className="response-header">
                    <strong>Your Response:</strong>
                  </div>
                  <p>{feedback.responseFromStaff}</p>
                  <button
                    className="btn-edit-response"
                    onClick={() => {
                      setRespondingTo(feedback._id || feedback.id);
                      setResponseText(feedback.responseFromStaff);
                    }}
                  >
                    Edit Response
                  </button>
                </div>
              ) : (
                <div className="feedback-actions">
                  {respondingTo === (feedback._id || feedback.id) ? (
                    <div className="response-form">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
                        rows="3"
                        maxLength={1000}
                      />
                      <div className="response-actions">
                        <button
                          className="btn-primary"
                          onClick={() => handleRespond(feedback._id || feedback.id)}
                        >
                          Submit Response
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-respond"
                      onClick={() => {
                        setRespondingTo(feedback._id || feedback.id);
                        setResponseText('');
                      }}
                    >
                      Respond to Feedback
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackManagement;

