/**
 * @fileoverview Staff dashboard page
 * @module pages/StaffDashboard
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';

import '../styles/Theme.css';
import './Dashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState({
    checkInsToday: 0,
    checkOutsToday: 0,
    pendingBookings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/staff/tasks-today');

        // backend থেকে যা আসবে সেটা safe ভাবে set করছি
        setTasks({
          checkInsToday: res.data?.data?.checkInsToday ?? res.data?.data?.checkins ?? 0,
          checkOutsToday: res.data?.data?.checkOutsToday ?? res.data?.data?.checkouts ?? 0,
          pendingBookings: res.data?.data?.pendingBookings ?? res.data?.data?.pending ?? 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load today's tasks");
        console.error('Error fetching staff tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && ['staff', 'admin'].includes(user.role)) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <Loader />;

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">staff dashboard</h1>
          <p className="page-subtitle">
            welcome, {user?.name || 'staff'} — manage check-ins, bookings, and services.
          </p>
        </div>

        <div className="page-actions">
          <Link className="btn-primary" to="/staff/bookings">manage bookings</Link>
          <Link className="btn-secondary" to="/staff/front-desk">front desk</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>check-ins today</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{tasks.checkInsToday ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>scheduled arrivals</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>check-outs today</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{tasks.checkOutsToday ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>scheduled departures</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>pending bookings</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{tasks.pendingBookings ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>awaiting approval</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>quick actions</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>6</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>available features</div>
          </div>
        </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>📅</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>manage bookings</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>view and manage all reservations.</div>
          <Link className="btn-primary" to="/staff/bookings" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🚪</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>front desk</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>check-in and check-out guests.</div>
          <Link className="btn-primary" to="/staff/front-desk" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🛏️</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>room availability</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>view available rooms and inventory.</div>
          <Link className="btn-primary" to="/customer/rooms" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💬</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>feedback</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>handle customer inquiries and feedback.</div>
          <Link className="btn-primary" to="/admin/feedback" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🔧</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>services</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>process additional services.</div>
          <Link className="btn-primary" to="/staff/services" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💰</div>
          <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>billing</div>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>process payments and invoices.</div>
          <Link className="btn-primary" to="/staff/billing" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
        </div>
        </div>
      </section>
    </div>
  );
};

export default StaffDashboard;
