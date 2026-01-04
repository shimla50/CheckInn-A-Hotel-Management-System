/**
 * @fileoverview Room model for hotel room management
 * @module models/Room
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} RoomSchema
 * @property {string} code - Room code/number (unique identifier)
 * @property {('single'|'double'|'suite')} type - Room type
 * @property {number} pricePerNight - Price per night
 * @property {string[]} amenities - List of FREE built-in room amenities (e.g., Breakfast, WiFi, AC, TV)
 *                                  Note: These are included in room price and do NOT add extra cost.
 *                                  Additional paid services (laundry, meals, etc.) are managed via Service model.
 * @property {('available'|'booked'|'maintenance')} status - Room availability status
 * @property {number} maxGuests - Maximum number of guests
 * @property {Date} createdAt - Room creation timestamp
 * @property {Date} updatedAt - Room last update timestamp
 */

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Room code is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Room code cannot exceed 20 characters'],
    },
    type: {
      type: String,
      enum: ['single', 'double', 'suite'],
      required: [true, 'Room type is required'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
      required: true,
    },
    maxGuests: {
      type: Number,
      required: [true, 'Maximum guests is required'],
      min: [1, 'Maximum guests must be at least 1'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're handling timestamps manually
    versionKey: false,
  }
);

// Update updatedAt before saving
roomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequent queries
roomSchema.index({ status: 1 }); // Query by status
roomSchema.index({ type: 1, status: 1 }); // Query by type and status
roomSchema.index({ code: 1 }, { unique: true }); // Enforce unique room code at DB level

const Room = mongoose.model('Room', roomSchema);

export default Room;

