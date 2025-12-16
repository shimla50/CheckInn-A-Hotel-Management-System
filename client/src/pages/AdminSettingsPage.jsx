/**
 * @fileoverview Admin settings page for system configuration
 * @module pages/AdminSettingsPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import Loader from '../components/Loader';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState({
    defaultTaxRate: 10,
    currencySymbol: '৳',
    defaultCheckInTime: '14:00',
    defaultCheckOutTime: '11:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data.data.settings);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
      showNotification('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const updateData = {
        defaultTaxRate: parseFloat(settings.defaultTaxRate),
        currencySymbol: settings.currencySymbol,
        defaultCheckInTime: settings.defaultCheckInTime,
        defaultCheckOutTime: settings.defaultCheckOutTime,
      };

      await api.patch('/admin/settings', updateData);
      showNotification('Settings updated successfully', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update settings';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="admin-settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure basic system settings and defaults</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-form-container">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <h3>Financial Settings</h3>
            <div className="form-group">
              <label htmlFor="defaultTaxRate">
                Default Tax Rate (%)
                <span className="help-text">Enter a value between 0 and 100</span>
              </label>
              <input
                type="number"
                id="defaultTaxRate"
                name="defaultTaxRate"
                value={settings.defaultTaxRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currencySymbol">
                Currency Symbol
                <span className="help-text">Symbol used for currency display (e.g., ৳, BDT)</span>
              </label>
              <input
                type="text"
                id="currencySymbol"
                name="currencySymbol"
                value={settings.currencySymbol}
                onChange={handleInputChange}
                maxLength="5"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Check-in/Check-out Times</h3>
            <div className="form-group">
              <label htmlFor="defaultCheckInTime">
                Default Check-in Time
                <span className="help-text">Format: HH:mm (24-hour format)</span>
              </label>
              <input
                type="time"
                id="defaultCheckInTime"
                name="defaultCheckInTime"
                value={settings.defaultCheckInTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="defaultCheckOutTime">
                Default Check-out Time
                <span className="help-text">Format: HH:mm (24-hour format)</span>
              </label>
              <input
                type="time"
                id="defaultCheckOutTime"
                name="defaultCheckOutTime"
                value={settings.defaultCheckOutTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={fetchSettings}
              disabled={saving}
            >
              Reset to Saved
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

