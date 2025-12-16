/**
 * @fileoverview Admin staff accounts management page
 * @module pages/AdminStaffAccountsPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './AdminStaffAccountsPage.css';

const AdminStaffAccountsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [filters, setFilters] = useState({
    isActive: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStaff();
    }
  }, [user, filters]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.isActive !== '') params.append('isActive', filters.isActive);

      const response = await api.get(`/admin/staff?${params.toString()}`);
      setStaff(response.data.data.staff || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch staff accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/admin/staff', formData);
      showNotification('Staff account created successfully', 'success');
      setFormData({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchStaff();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create staff account';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const handleStatusChange = async (staffId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${staffId}/status`, { isActive: !currentStatus });
      showNotification(`Staff ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchStaff();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update staff status', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading && staff.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-staff-page">
      <div className="page-header">
        <h1>Staff Accounts Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create New Staff'}
        </button>
      </div>

      {showForm && (
        <div className="create-staff-form-container">
          <h3>Create New Staff Account</h3>
          <form onSubmit={handleCreateStaff} className="create-staff-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Temporary Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                placeholder="Minimum 6 characters"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn-save">Create Staff</button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', email: '', password: '' });
                  setError('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            className="btn-clear"
            onClick={() => setFilters({ isActive: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && !showForm && <div className="error-message">{error}</div>}

      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No staff accounts found
                </td>
              </tr>
            ) : (
              staff.map((staffMember) => (
                <tr key={staffMember._id || staffMember.id}>
                  <td>{staffMember.name}</td>
                  <td>{staffMember.email}</td>
                  <td>
                    <span className={`status-badge ${staffMember.isActive ? 'active' : 'inactive'}`}>
                      {staffMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(staffMember.createdAt)}</td>
                  <td>
                    <button
                      className={`btn-status ${staffMember.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => handleStatusChange(staffMember._id || staffMember.id, staffMember.isActive)}
                    >
                      {staffMember.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStaffAccountsPage;

