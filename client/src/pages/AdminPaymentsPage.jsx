/**
 * @fileoverview Admin payments page for viewing payment transactions
 * @module pages/AdminPaymentsPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './AdminPaymentsPage.css';

const AdminPaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    bookingId: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPayments();
    }
  }, [user, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.bookingId) params.append('bookingId', filters.bookingId);
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/payments?${params.toString()}`);
      setPayments(response.data.data.payments || []);
      setSummary(response.data.data.summary || summary);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading && payments.length === 0) {
    return <Loader />;
  }

  return (
    <div className="admin-payments-page">
      <div className="page-header">
        <h1>Payment Transactions</h1>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Amount</div>
          <div className="summary-value">{formatCurrency(summary.totalAmount)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Transactions</div>
          <div className="summary-value">{summary.totalCount}</div>
        </div>
        <div className="summary-card success">
          <div className="summary-label">Paid</div>
          <div className="summary-value">{summary.paidCount}</div>
        </div>
        <div className="summary-card warning">
          <div className="summary-label">Pending</div>
          <div className="summary-value">{summary.pendingCount}</div>
        </div>
        <div className="summary-card error">
          <div className="summary-label">Failed</div>
          <div className="summary-value">{summary.failedCount}</div>
        </div>
      </div>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Booking ID</label>
            <input
              type="text"
              name="bookingId"
              value={filters.bookingId}
              onChange={handleFilterChange}
              placeholder="Enter booking ID"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
              <option value="sslcommerz">SSL Commerz</option>
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
          <button className="btn-clear" onClick={() => setFilters({
            bookingId: '',
            status: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
          })}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id || payment.id}>
                  <td>{payment.invoiceNumber || 'N/A'}</td>
                  <td>
                    {payment.booking?._id ? (
                      <span className="booking-id">{String(payment.booking._id).slice(-8)}</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {payment.booking?.guest?.name || 'N/A'}
                    {payment.booking?.guest?.email && (
                      <div className="customer-email">{payment.booking.guest.email}</div>
                    )}
                  </td>
                  <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                  <td>
                    <span className={`method-badge method-${payment.paymentMethod}`}>
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.transactionId || 'N/A'}</td>
                  <td>{formatDate(payment.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;

