/**
 * @fileoverview Staff services page for managing services attached to bookings
 * @module pages/StaffServicesPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './StaffServicesPage.css';

const StaffServicesPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [serviceUsages, setServiceUsages] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    quantity: 1,
  });

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchBookings();
      fetchServices();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBooking) {
      fetchServiceUsages(selectedBooking);
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services?isActive=true');
      setAvailableServices(response.data.data.services || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const fetchServiceUsages = async (bookingId) => {
    try {
      const response = await api.get(`/service-usage/booking/${bookingId}`);
      setServiceUsages(response.data.data.serviceUsages || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch service usages');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.serviceId || !formData.quantity) {
      setError('Please select a service and enter quantity');
      return;
    }

    try {
      await api.post(`/service-usage/booking/${selectedBooking}`, {
        serviceId: formData.serviceId,
        quantity: formData.quantity,
      });
      showNotification('Service added successfully', 'success');
      setShowAddForm(false);
      setFormData({ serviceId: '', quantity: 1 });
      fetchServiceUsages(selectedBooking);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add service';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const handleRemoveService = async (usageId) => {
    if (!window.confirm('Are you sure you want to remove this service?')) {
      return;
    }

    try {
      await api.delete(`/service-usage/booking/${selectedBooking}/usage/${usageId}`);
      showNotification('Service removed successfully', 'success');
      fetchServiceUsages(selectedBooking);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to remove service';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user || !['staff', 'admin'].includes(user.role)) {
    return <div className="staff-only">Staff/Admin access required</div>;
  }

  if (loading && bookings.length === 0) {
    return <Loader />;
  }

  return (
    <div className="staff-services-page">
      <div className="page-header">
        <h1>Manage Booking Services</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="services-layout">
        <div className="bookings-panel">
          <h2>Select Booking</h2>
          <div className="bookings-list">
            {bookings.length === 0 ? (
              <div className="empty-state">No bookings found</div>
            ) : (
              bookings
                .filter((b) => !['cancelled', 'checked_out'].includes(b.status))
                .map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className={`booking-card ${
                      selectedBooking === (booking._id || booking.id) ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedBooking(booking._id || booking.id)}
                  >
                    <div className="booking-header">
                      <strong>Booking #{String(booking._id || booking.id).slice(-8)}</strong>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="booking-details">
                      <div>Guest: {booking.guest?.name || 'N/A'}</div>
                      <div>Room: {booking.room?.code || 'N/A'}</div>
                      <div>
                        {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="services-panel">
          {selectedBooking ? (
            <>
              <div className="panel-header">
                <h2>Services for Booking</h2>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : '+ Add Service'}
                </button>
              </div>

              {showAddForm && (
                <div className="add-service-form">
                  <h3>Add Service</h3>
                  <form onSubmit={handleAddService}>
                    <div className="form-group">
                      <label>Service</label>
                      <select
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a service</option>
                        {availableServices.map((service) => (
                          <option key={service._id || service.id} value={service._id || service.id}>
                            {service.name} - {formatCurrency(service.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save">
                        Add Service
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="service-usages-list">
                {serviceUsages.length === 0 ? (
                  <div className="empty-state">
                    No services added to this booking yet
                  </div>
                ) : (
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceUsages.map((usage) => (
                        <tr key={usage._id || usage.id}>
                          <td>
                            <div className="service-name">
                              {usage.service?.name || 'N/A'}
                            </div>
                            {usage.service?.description && (
                              <div className="service-description">
                                {usage.service.description}
                              </div>
                            )}
                          </td>
                          <td>{usage.quantity}</td>
                          <td>{formatCurrency(usage.service?.price || 0)}</td>
                          <td className="amount">{formatCurrency(usage.amount)}</td>
                          <td>
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveService(usage._id || usage.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="total-label">
                          <strong>Total Services:</strong>
                        </td>
                        <td className="total-amount">
                          <strong>
                            {formatCurrency(
                              serviceUsages.reduce((sum, u) => sum + u.amount, 0)
                            )}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="empty-selection">
              <p>Select a booking to view and manage its services</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffServicesPage;

