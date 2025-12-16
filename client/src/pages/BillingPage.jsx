/**
 * @fileoverview Billing page for invoice generation and payment recording
 * @module pages/BillingPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './BillingPage.css';

const BillingPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
  });

  useEffect(() => {
    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchBookings();
    }
  }, [user]);

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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.guest?.name?.toLowerCase().includes(searchLower) ||
      booking.guest?.email?.toLowerCase().includes(searchLower) ||
      booking.room?.code?.toLowerCase().includes(searchLower) ||
      (booking._id || booking.id).toString().includes(searchLower)
    );
  });

  const handleViewInvoice = async (bookingId) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/billing/bookings/${bookingId}/invoice`);
      setInvoice(response.data.data.invoice);
      setSelectedBooking(bookingId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBooking) {
      setError('Please select a booking first');
      return;
    }

    try {
      setLoading(true);
      const paymentPayload = {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
      };

      if (paymentData.transactionId) {
        paymentPayload.transactionId = paymentData.transactionId;
      }

      await api.post(`/billing/bookings/${selectedBooking}/payment`, paymentPayload);
      
      // Refresh invoice
      await handleViewInvoice(selectedBooking);
      
      setShowPaymentForm(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'cash',
        transactionId: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user || !['staff', 'admin'].includes(user.role)) {
    return <div className="staff-only">Staff/Admin access required</div>;
  }

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1>Billing & Invoices</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="billing-container">
        {/* Bookings List */}
        <div className="bookings-section">
          <div className="section-header">
            <h2>Bookings</h2>
            <input
              type="text"
              placeholder="Search by guest name, email, room, or booking ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          {loading && bookings.length === 0 ? (
            <Loader />
          ) : (
            <div className="bookings-list">
              {filteredBookings.length === 0 ? (
                <p className="empty-message">No bookings found</p>
              ) : (
                filteredBookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    className={`booking-item ${
                      selectedBooking === (booking._id || booking.id)
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => handleViewInvoice(booking._id || booking.id)}
                  >
                    <div className="booking-info">
                      <div className="guest-name">
                        {booking.guest?.name || 'N/A'}
                      </div>
                      <div className="booking-details">
                        <span>Room: {booking.room?.code || 'N/A'}</span>
                        <span>•</span>
                        <span>
                          {formatDate(booking.checkInDate)} -{' '}
                          {formatDate(booking.checkOutDate)}
                        </span>
                      </div>
                      <div className="booking-amount">
                        Total: {formatCurrency(booking.totalAmount)}
                      </div>
                    </div>
                    <div className="booking-status">
                      <span
                        className={`status-badge status-${booking.status?.replace(
                          '_',
                          '-'
                        )}`}
                      >
                        {booking.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Invoice Section */}
        {invoice && (
          <div className="invoice-section">
            <div className="invoice-actions">
              <button
                className="btn-primary"
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                {showPaymentForm ? 'Cancel Payment' : 'Record Payment'}
              </button>
              <button className="btn-secondary" onClick={handlePrintInvoice}>
                Print Invoice
              </button>
            </div>

            {showPaymentForm && (
              <div className="payment-form-card">
                <h3>Record Payment</h3>
                <form onSubmit={handleRecordPayment}>
                  <div className="form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select
                      name="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={handlePaymentInputChange}
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  {paymentData.paymentMethod === 'online' && (
                    <div className="form-group">
                      <label>Transaction ID (optional)</label>
                      <input
                        type="text"
                        name="transactionId"
                        value={paymentData.transactionId}
                        onChange={handlePaymentInputChange}
                        placeholder="Transaction ID"
                      />
                    </div>
                  )}
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Processing...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="invoice-card printable">
              <div className="invoice-header">
                <div>
                  <h2>CheckInn Hotel</h2>
                  <p>123 Hotel Street, City, State 12345</p>
                  <p>Phone: (555) 123-4567 | Email: info@checkinn.com</p>
                </div>
                <div className="invoice-number">
                  <strong>Invoice #</strong>
                  <div>{invoice.invoiceNumber}</div>
                  <div className="invoice-date">
                    Date: {formatDate(invoice.issueDate)}
                  </div>
                </div>
              </div>

              <div className="invoice-body">
                <div className="invoice-section-row">
                  <div className="invoice-col">
                    <h3>Bill To:</h3>
                    <p>{invoice.guest.name}</p>
                    <p>{invoice.guest.email}</p>
                  </div>
                  <div className="invoice-col">
                    <h3>Booking Details:</h3>
                    <p>Room: {invoice.room.code} ({invoice.room.type})</p>
                    <p>
                      Check-in: {formatDate(invoice.stayDetails.checkInDate)}
                    </p>
                    <p>
                      Check-out: {formatDate(invoice.stayDetails.checkOutDate)}
                    </p>
                    <p>Nights: {invoice.stayDetails.totalNights}</p>
                  </div>
                </div>

                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">
                        <strong>Total:</strong>
                      </td>
                      <td className="total-amount">
                        <strong>{formatCurrency(invoice.totals.total)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="payment-summary">
                  <h3>Payment Summary</h3>
                  <div className="summary-row">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(invoice.paymentSummary.totalPaid)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Balance Due:</span>
                    <span
                      className={
                        invoice.paymentSummary.balanceDue > 0
                          ? 'balance-due'
                          : 'balance-paid'
                      }
                    >
                      {formatCurrency(invoice.paymentSummary.balanceDue)}
                    </span>
                  </div>
                  <div className="summary-row status-row">
                    <span>Status:</span>
                    <span
                      className={
                        invoice.paymentSummary.isFullyPaid
                          ? 'status-paid'
                          : 'status-pending'
                      }
                    >
                      {invoice.paymentSummary.isFullyPaid
                        ? 'Fully Paid'
                        : 'Pending Payment'}
                    </span>
                  </div>
                </div>

                {invoice.payments && invoice.payments.length > 0 && (
                  <div className="payment-history">
                    <h3>Payment History</h3>
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.payments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{formatDate(payment.createdAt)}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.method.toUpperCase()}</td>
                            <td>
                              <span
                                className={`payment-status status-${payment.status}`}
                              >
                                {payment.status.toUpperCase()}
                              </span>
                            </td>
                            <td>{payment.transactionId || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="invoice-footer">
                <p>Thank you for choosing CheckInn Hotel!</p>
                <p className="footer-note">
                  This is a computer-generated invoice. No signature required.
                </p>
              </div>
            </div>
          </div>
        )}

        {!invoice && (
          <div className="no-invoice-message">
            <p>Select a booking to view invoice</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;

