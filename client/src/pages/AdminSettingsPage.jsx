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
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingPromotion, setSendingPromotion] = useState(false);
  const [promotionData, setPromotionData] = useState({
    title: '',
    message: '',
    filterByPastBookings: false,
  });

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

  const handleSendReminders = async () => {
    if (!window.confirm('Send check-in reminders to all guests with bookings tomorrow?')) {
      return;
    }

    setSendingReminders(true);
    setError('');

    try {
      const response = await api.post('/admin/notifications/send-checkin-reminders');
      const { sent, failed, total } = response.data.data;
      showNotification(
        `Reminders sent: ${sent} successful, ${failed} failed out of ${total} total`,
        sent > 0 ? 'success' : 'error'
      );
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send reminders';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendPromotion = async (e) => {
    e.preventDefault();
    setError('');

    if (!promotionData.title || !promotionData.message) {
      setError('Title and message are required');
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!window.confirm(`Send promotion email to ${promotionData.filterByPastBookings ? 'customers with past bookings' : 'all customers'}?`)) {
      return;
    }

    setSendingPromotion(true);

    try {
      const response = await api.post('/admin/notifications/send-promotion', {
        title: promotionData.title,
        message: promotionData.message,
        filterByPastBookings: promotionData.filterByPastBookings,
      });
      const { sent, failed, total } = response.data.data;
      showNotification(
        `Promotion emails sent: ${sent} successful, ${failed} failed out of ${total} total`,
        sent > 0 ? 'success' : 'error'
      );
      setPromotionData({
        title: '',
        message: '',
        filterByPastBookings: false,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send promotion emails';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setSendingPromotion(false);
    }
  };

  const handlePromotionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromotionData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

      {/* Email Notifications Section */}
      <div className="settings-form-container" style={{ marginTop: '30px' }}>
        <div className="form-section">
          <h3>Email Notifications</h3>
          
          {/* Check-in Reminders */}
          <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>Check-in Reminders</h4>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Send check-in reminder emails to all guests with bookings scheduled for tomorrow.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSendReminders}
              disabled={sendingReminders}
              style={{ minWidth: '200px' }}
            >
              {sendingReminders ? 'Sending...' : 'Send Check-in Reminders'}
            </button>
          </div>

          {/* Promotion Emails */}
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>Promotion Emails</h4>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Send promotional emails to customers. You can choose to send to all customers or only those with past bookings.
            </p>
            <form onSubmit={handleSendPromotion}>
              <div className="form-group">
                <label htmlFor="promotionTitle">
                  Promotion Title *
                </label>
                <input
                  type="text"
                  id="promotionTitle"
                  name="title"
                  value={promotionData.title}
                  onChange={handlePromotionInputChange}
                  placeholder="e.g., Special Summer Offer"
                  required
                  style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="promotionMessage">
                  Promotion Message *
                </label>
                <textarea
                  id="promotionMessage"
                  name="message"
                  value={promotionData.message}
                  onChange={handlePromotionInputChange}
                  placeholder="Enter your promotion message here..."
                  required
                  rows="5"
                  style={{ width: '100%', padding: '10px', marginTop: '5px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="filterByPastBookings"
                    checked={promotionData.filterByPastBookings}
                    onChange={handlePromotionInputChange}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <span>Only send to customers with past bookings</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sendingPromotion}
                >
                  {sendingPromotion ? 'Sending...' : 'Send Promotion Emails'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

