/**
 * @fileoverview Admin services management page
 * @module pages/AdminServicesPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './AdminServicesPage.css';

const AdminServicesPage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isActive: true,
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data.data.services || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        isActive: formData.isActive,
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, serviceData);
      } else {
        await api.post('/services', serviceData);
      }

      setShowForm(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        isActive: true,
      });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
    }
  };

  const handleEdit = (service) => {
    setEditingService({ id: service._id || service.id });
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      isActive: service.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/services/${serviceId}`);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      isActive: true,
    });
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="admin-services-page">
      <div className="page-header">
        <h1>Service Management</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          Add New Service
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="service-form-card">
          <h2>{editingService ? 'Edit Service' : 'Create New Service'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Room Service"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Service description"
              />
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="services-grid">
        {services.length === 0 ? (
          <p className="empty-state">No services found. Create your first service!</p>
        ) : (
          services.map((service) => (
            <div key={service._id || service.id} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                <span
                  className={`status-badge ${
                    service.isActive ? 'status-active' : 'status-inactive'
                  }`}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {service.description && (
                <p className="service-description">{service.description}</p>
              )}
              <div className="service-price">{formatCurrency(service.price)}</div>
              <div className="service-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(service)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(service._id || service.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminServicesPage;

