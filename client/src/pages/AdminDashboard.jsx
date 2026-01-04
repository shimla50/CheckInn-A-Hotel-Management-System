/**
 * @fileoverview Admin dashboard page
 * @module pages/AdminDashboard
 */
import '../styles/Theme.css';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    activeBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/admin/summary');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin summary');
        console.error('Error fetching admin summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSummary();
    }
  }, [user]);

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
         <h1 className="page-title">admin dashboard</h1>
         <p className="page-subtitle">welcome, {user?.name || "admin"} — manage rooms, bookings, and guests.</p>
        </div>

        <div className="page-actions">
         <Link className="btn-primary" to="/admin/rooms">manage rooms</Link>
         <Link className="btn-secondary" to="/admin/bookings">view bookings</Link>
        </div>
      </header>

      <section className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>total users</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats?.totalUsers ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>admins • staff • customers</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>total rooms</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats?.totalRooms ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>inventory overview</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>active bookings</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{stats?.activeBookings ?? 0}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>today & upcoming</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ color: '#0f2c44', fontWeight: 800, textTransform: 'capitalize', fontSize: '12px', opacity: 0.9 }}>total revenue</div>
            <div style={{ marginTop: '10px', fontSize: '38px', fontWeight: 900, color: '#0b1b2a' }}>{formatCurrency(stats?.totalRevenue ?? 0)}</div>
            <div style={{ marginTop: '6px', color: '#2b3b4a', fontSize: '12px', textTransform: 'capitalize', opacity: 0.9 }}>billing summary</div>
          </div>
        </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>👥</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>user management</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>manage admins, staff, and customers.</div>
    <Link className="btn-primary" to="/admin/users" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🛏️</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>rooms & inventory</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>add rooms, types, pricing, and status.</div>
    <Link className="btn-primary" to="/admin/rooms" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>📅</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>bookings</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>monitor reservations across the system.</div>
    <Link className="btn-primary" to="/admin/bookings" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💬</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>feedback</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>reply to customer feedback & requests.</div>
    <Link className="btn-primary" to="/admin/feedback" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>📊</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>revenue reports</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>view revenue, occupancy, and analytics.</div>
    <Link className="btn-primary" to="/admin/reports" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>💰</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>payments</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>view all payment transactions and history.</div>
    <Link className="btn-primary" to="/admin/payments" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>⚙️</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>settings</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>configure system settings and notifications.</div>
    <Link className="btn-primary" to="/admin/settings" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>

  <div className="card-glass">
    <div style={{ fontSize: '22px', width: '42px', height: '42px', display: 'grid', placeItems: 'center', borderRadius: '12px', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.25)' }}>🔧</div>
    <div style={{ marginTop: '12px', fontWeight: 900, textTransform: 'capitalize', fontSize: '16px' }}>services</div>
    <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.82)', fontSize: '13px', lineHeight: '1.5', textTransform: 'capitalize' }}>manage additional services (laundry, meals, etc.).</div>
    <Link className="btn-primary" to="/admin/services" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', padding: '8px 12px' }}>open</Link>
  </div>
        </div>
      </section>
    </div>

  );
};

export default AdminDashboard;
