/**
 * @fileoverview Admin users management page
 * @module pages/AdminUsersPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data.users || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showNotification('User role updated successfully', 'success');
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      showNotification(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update user status', 'error');
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

  if (loading && users.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <h1>User Management</h1>
      </div>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
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
            onClick={() => setFilters({ role: '', isActive: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((userItem) => (
                <tr key={userItem._id || userItem.id}>
                  <td>{userItem.name}</td>
                  <td>{userItem.email}</td>
                  <td>
                    <select
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem._id || userItem.id, e.target.value)}
                      disabled={userItem._id === user?.id || userItem.id === user?.id}
                      className="role-select"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="customer">Customer</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${userItem.isActive ? 'active' : 'inactive'}`}>
                      {userItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(userItem.createdAt)}</td>
                  <td>
                    <button
                      className={`btn-status ${userItem.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => handleStatusChange(userItem._id || userItem.id, userItem.isActive)}
                      disabled={userItem._id === user?.id || userItem.id === user?.id}
                    >
                      {userItem.isActive ? 'Deactivate' : 'Activate'}
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

export default AdminUsersPage;

