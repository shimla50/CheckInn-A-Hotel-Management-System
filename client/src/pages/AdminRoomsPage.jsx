/**
 * @fileoverview Admin rooms management page
 * @module pages/AdminRoomsPage
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import '../styles/Theme.css';
import './AdminRoomsPage.css';

const AdminRoomsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  // Default free amenities included with all rooms
  const DEFAULT_FREE_AMENITIES = ['Breakfast', 'WiFi', 'Air Conditioning', 'TV', 'Room Service'];
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'single',
    pricePerNight: '',
    amenities: DEFAULT_FREE_AMENITIES.join(', '), // Default includes breakfast
    status: 'available',
    maxGuests: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms');
      setRooms(response.data.data.rooms || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const amenitiesArray = formData.amenities
        ? formData.amenities.split(',').map((a) => a.trim())
        : [];

      const roomData = {
        code: formData.code,
        type: formData.type,
        pricePerNight: Number(formData.pricePerNight),
        amenities: amenitiesArray,
        status: formData.status,
        maxGuests: Number(formData.maxGuests),
      };

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, roomData);
      } else {
        await api.post('/rooms', roomData);
      }

      setShowForm(false);
      setEditingRoom(null);
      setFormData({
        code: '',
        type: 'single',
        pricePerNight: '',
        amenities: DEFAULT_FREE_AMENITIES.join(', '), // Default includes breakfast
        status: 'available',
        maxGuests: '',
      });
      // Refresh rooms list to show new/updated room
      fetchRooms();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const friendly =
        apiMessage && apiMessage.toLowerCase().includes('code')
          ? 'Room code already exists'
          : apiMessage || 'Failed to save room';
      setError(friendly);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom({ id: room._id || room.id });
    setFormData({
      code: room.code,
      type: room.type,
      pricePerNight: room.pricePerNight,
      amenities: room.amenities?.join(', ') || '',
      status: room.status,
      maxGuests: room.maxGuests,
    });
    setShowForm(true);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      await api.delete(`/rooms/${roomId}`);
      // Remove from local state immediately for instant UI update
      setRooms((prevRooms) => prevRooms.filter((room) => (room._id || room.id) !== roomId));
      // Also refetch to ensure consistency
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({
      code: '',
      type: 'single',
      pricePerNight: '',
      amenities: '',
      status: 'available',
      maxGuests: '',
    });
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">room management</h1>
          <p className="page-subtitle">manage rooms, types, pricing, and availability.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            add new room
          </button>
          <Link className="btn-secondary" to="/admin/dashboard">
            back to dashboard
          </Link>
        </div>
      </header>

      <section className="page-content">
        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <div className="card">
            <div className="card-header">{editingRoom ? 'Edit Room' : 'Create New Room'}</div>
            <div className="card-body">
          <h2>{editingRoom ? 'Edit Room' : 'Create New Room'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 800, color: '#0b1b2a', textTransform: 'capitalize' }}>Room Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 101"
                />
              </div>
              <div className="form-group">
                <label>Room Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price Per Night *</label>
                <input
                  type="number"
                  name="pricePerNight"
                  value={formData.pricePerNight}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Max Guests *</label>
                <input
                  type="number"
                  name="maxGuests"
                  value={formData.maxGuests}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Free Amenities (comma-separated) *
                <span style={{ fontSize: '12px', color: '#666', display: 'block', marginTop: '4px', fontWeight: 'normal' }}>
                  These are included in room price (e.g., Breakfast, WiFi, TV, AC). Breakfast is included by default.
                </span>
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleInputChange}
                placeholder="Breakfast, WiFi, TV, AC, Room Service"
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary">
                {editingRoom ? 'Update Room' : 'Create Room'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
        {rooms.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <div className="card-body">
              <p className="empty-state">No rooms found. Create your first room!</p>
            </div>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room._id || room.id} className="card">
              <div className="card-body">
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', color: '#0b1b2a' }}>{room.code}</h3>
                  <span style={{ 
                    padding: '6px 10px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    textTransform: 'capitalize',
                    background: room.status === 'available' ? 'rgba(39,174,96,0.16)' : room.status === 'booked' ? 'rgba(243,156,18,0.16)' : 'rgba(231,76,60,0.16)',
                    color: room.status === 'available' ? '#27ae60' : room.status === 'booked' ? '#f39c12' : '#e74c3c'
                  }}>
                    {room.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ margin: '4px 0' }}><strong>Type:</strong> {room.type}</p>
                  <p style={{ margin: '4px 0' }}><strong>Price:</strong> {formatCurrency(room.pricePerNight)}/night</p>
                  <p style={{ margin: '4px 0' }}><strong>Max Guests:</strong> {room.maxGuests}</p>
                  {room.amenities && room.amenities.length > 0 && (
                    <p style={{ margin: '4px 0' }}><strong>Amenities:</strong> {room.amenities.join(', ')}</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn-primary"
                  onClick={() => handleEdit(room)}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(room._id || room.id)}
                  style={{ fontSize: '14px', padding: '8px 12px' }}
                >
                  Delete
                </button>
              </div>
              </div>
            </div>
          ))
        )}
        </div>
      </section>
    </div>
  );
};

export default AdminRoomsPage;

