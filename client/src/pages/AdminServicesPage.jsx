/**
 * @fileoverview Admin services management page
 * @module pages/AdminServicesPage
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import '../styles/Theme.css';
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
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">service management</h1>
          <p className="page-subtitle">manage additional services (laundry, meals, etc.).</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            add new service
          </button>
          <Link className="btn-secondary" to="/admin/dashboard">
            back to dashboard
          </Link>
        </div>
      </header>

      <section className="page-content">
        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <div className="card">
            <div className="card-header">{editingService ? 'Edit Service' : 'Create New Service'}</div>
            <div className="card-body">
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
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
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
        {services.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <div className="card-body">
              <p className="empty-state">No services found. Create your first service!</p>
            </div>
          </div>
        ) : (
          services.map((service) => (
            <div key={service._id || service.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'capitalize', color: '#0b1b2a' }}>{service.name}</h3>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: service.isActive ? 'rgba(39,174,96,0.16)' : 'rgba(231,76,60,0.16)',
                      color: service.isActive ? '#27ae60' : '#e74c3c'
                    }}
                  >
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {service.description && (
                  <p style={{ margin: '8px 0', color: '#0b1b2a', fontSize: '14px' }}>{service.description}</p>
                )}
                <div style={{ margin: '12px 0', fontWeight: 900, fontSize: '18px', color: '#0b1b2a' }}>{formatCurrency(service.price)}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleEdit(service)}
                    style={{ fontSize: '14px', padding: '8px 12px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(service._id || service.id)}
                    style={{ fontSize: '14px', padding: '8px 12px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </section>
    </div>
  );
};

export default AdminServicesPage;

