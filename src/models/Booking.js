/**
 * @fileoverview Booking model for hotel reservations
 * @module models/Booking
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} BookingSchema
 * @property {mongoose.Types.ObjectId} guest - Reference to User (customer)
 * @property {mongoose.Types.ObjectId} room - Reference to Room
 * @property {Date} checkInDate - Check-in date
 * @property {Date} checkOutDate - Check-out date
 * @property {('pending'|'approved'|'checked_in'|'checked_out'|'cancelled')} status - Booking status
 * @property {number} totalNights - Total number of nights (computed)
 * @property {number} totalAmount - Total booking amount
 * @property {mongoose.Types.ObjectId} createdBy - Reference to User who created the booking (staff/admin/customer)
 * @property {Date} createdAt - Booking creation timestamp
 * @property {Date} updatedAt - Booking last update timestamp
 */

const bookingSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guest is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
      validate: {
        validator: function (value) {
          return value > this.checkInDate;
        },
        message: 'Check-out date must be after check-in date',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'checked_in', 'checked_out', 'cancelled'],
      default: 'pending',
      required: true,
    },
    totalNights: {
      type: Number,
      required: true,
      min: [1, 'Total nights must be at least 1'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
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

// Calculate totalNights before saving
bookingSchema.pre('save', function (next) {
  if (this.isModified('checkInDate') || this.isModified('checkOutDate')) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const nights = Math.ceil(
      (this.checkOutDate - this.checkInDate) / oneDay
    );
    this.totalNights = nights > 0 ? nights : 1; // Ensure at least 1 night
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequent queries
bookingSchema.index({ guest: 1 }); // Query bookings by guest
bookingSchema.index({ room: 1 }); // Query bookings by room
bookingSchema.index({ status: 1 }); // Query bookings by status
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 }); // Query by date range
bookingSchema.index({ guest: 1, status: 1 }); // Query guest bookings by status
bookingSchema.index({ room: 1, status: 1 }); // Query room bookings by status
bookingSchema.index({ createdBy: 1 }); // Query bookings by creator
bookingSchema.index({ checkInDate: 1 }); // Query by check-in date
bookingSchema.index({ checkOutDate: 1 }); // Query by check-out date

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

