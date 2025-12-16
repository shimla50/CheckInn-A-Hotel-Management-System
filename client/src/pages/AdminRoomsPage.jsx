/**
 * @fileoverview Admin rooms management page
 * @module pages/AdminRoomsPage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import formatCurrency from '../utils/formatCurrency';
import './AdminRoomsPage.css';

const AdminRoomsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'single',
    pricePerNight: '',
    amenities: '',
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
        amenities: '',
        status: 'available',
        maxGuests: '',
      });
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
    <div className="admin-rooms-page">
      <div className="page-header">
        <h1>Room Management</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          Add New Room
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="room-form-card">
          <h2>{editingRoom ? 'Edit Room' : 'Create New Room'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Room Code *</label>
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
              <label>Amenities (comma-separated)</label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleInputChange}
                placeholder="e.g., WiFi, TV, AC, Mini Bar"
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

            <div className="form-actions">
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
      )}

      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <p className="empty-state">No rooms found. Create your first room!</p>
        ) : (
          rooms.map((room) => (
            <div key={room._id || room.id} className="room-card">
              <div className="room-header">
                <h3>{room.code}</h3>
                <span className={`status-badge status-${room.status}`}>
                  {room.status}
                </span>
              </div>
              <div className="room-details">
                <p>
                  <strong>Type:</strong> {room.type}
                </p>
                <p>
                  <strong>Price:</strong> {formatCurrency(room.pricePerNight)}/night
                </p>
                <p>
                  <strong>Max Guests:</strong> {room.maxGuests}
                </p>
                {room.amenities && room.amenities.length > 0 && (
                  <p>
                    <strong>Amenities:</strong> {room.amenities.join(', ')}
                  </p>
                )}
              </div>
              <div className="room-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(room)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(room._id || room.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRoomsPage;

