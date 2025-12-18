/**
 * @fileoverview Customer payments page - view payment history
 * @module pages/CustomerPaymentsPage
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './CustomerPaymentsPage.css';

const CustomerPaymentsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');
  
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(bookingIdParam || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchBookings();
      if (selectedBooking) {
        fetchPayments(selectedBooking);
      }
    }
  }, [user, selectedBooking]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const fetchPayments = async (bookingId) => {
    try {
      setLoading(true);
      const response = await api.get(`/billing/bookings/${bookingId}/payments`);
      setPayments(response.data.data.payments || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#27ae60';
      case 'pending':
        return '#f39c12';
      case 'failed':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  if (user?.role !== 'customer') {
    return <div className="customer-only">Customer access required</div>;
  }

  const selectedBookingData = bookings.find(
    (b) => (b._id || b.id) === selectedBooking
  );

  return (
    <div className="customer-payments-page">
      <div className="page-header">
        <h1>Payment History</h1>
      </div>

      <div className="payments-layout">
        <div className="bookings-panel">
          <h2>Select Booking</h2>
          <div className="bookings-list">
            {bookings.length === 0 ? (
              <div className="empty-state">No bookings found</div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking._id || booking.id}
                  className={`booking-card ${
                    selectedBooking === (booking._id || booking.id) ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedBooking(booking._id || booking.id)}
                >
                  <div className="booking-header">
                    <strong>Booking #{String(booking._id || booking.id).slice(-8)}</strong>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div>Room: {booking.room?.code || 'N/A'}</div>
                    <div>Total: {formatCurrency(booking.totalAmount)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="payments-panel">
          {selectedBooking ? (
            <>
              <div className="panel-header">
                <h2>
                  Payments for Booking #{String(selectedBooking).slice(-8)}
                </h2>
              </div>

              {selectedBookingData && (
                <div className="booking-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Cost:</span>
                    <span className="summary-value">
                      {formatCurrency(selectedBookingData.totalAmount)}
                    </span>
                  </div>
                  {selectedBookingData && (
                    <div className="summary-item">
                      <span className="summary-label">Total Paid:</span>
                      <span className="summary-value">
                        {formatCurrency(
                          payments
                            .filter((p) => p.status === 'paid')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {loading ? (
                <Loader />
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : payments.length === 0 ? (
                <div className="empty-state">
                  No payments found for this booking
                </div>
              ) : (
                <div className="payments-table-container">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Transaction ID</th>
                        <th>Invoice #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id || payment.id}>
                          <td>{formatDate(payment.createdAt)}</td>
                          <td className="amount">{formatCurrency(payment.amount)}</td>
                          <td>
                            <span className={`method-badge method-${payment.paymentMethod}`}>
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(payment.status) }}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td>{payment.transactionId || 'N/A'}</td>
                          <td>{payment.invoiceNumber || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-selection">
              <p>Select a booking to view its payment history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentsPage;

