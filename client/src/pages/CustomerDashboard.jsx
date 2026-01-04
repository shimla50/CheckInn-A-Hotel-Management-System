/**
 * @fileoverview Customer dashboard page
 * @module pages/CustomerDashboard
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';

import '../styles/Theme.css';
import './Dashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/customer/my-bookings/summary');
        setBookings(res.data?.data?.bookings || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings');
        console.error('Error fetching customer bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'customer') {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const badgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'st st-approved';
    if (s === 'checked_in') return 'st st-in';
    if (s === 'checked_out') return 'st st-out';
    if (s === 'pending') return 'st st-pending';
    if (s === 'cancelled') return 'st st-cancelled';
    return 'st st-default';
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length;
    const active = bookings.filter((b) => ['approved', 'checked_in'].includes((b.status || '').toLowerCase())).length;

    // last booking amount (fallback)
    const lastAmount = bookings?.[0]?.totalAmount ?? 0;

    return { total, pending, active, lastAmount };
  }, [bookings]);

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">customer dashboard</h1>
          <p className="page-subtitle">
            welcome, {user?.name || 'guest'} — manage bookings, payments, and feedback.
          </p>
        </div>

        <div className="page-actions">
          <Link className="btn-primary" to="/customer/rooms">search rooms</Link>
          <Link className="btn-secondary" to="/customer/bookings">my bookings</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>total bookings</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats.total}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>history & upcoming</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>active</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats.active}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>approved / checked-in</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>pending</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats.pending}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>awaiting confirmation</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>last amount</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{formatCurrency(stats.lastAmount)}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>latest booking</div>
          </div>
        </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🛏️</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>search rooms</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>check availability & book a room.</div>
          <Link className="btn-primary" to="/customer/rooms" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>📅</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>booking history</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>view, cancel (if allowed).</div>
          <Link className="btn-primary" to="/customer/bookings" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💰</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>payments</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>invoices & payment history.</div>
          <Link className="btn-primary" to="/customer/payments" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💬</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>feedback</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>ratings & suggestions.</div>
          <Link className="btn-primary" to="/customer/feedback" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;