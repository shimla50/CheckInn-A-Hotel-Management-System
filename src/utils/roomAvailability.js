/**
 * @fileoverview Utility functions for checking room availability
 * @module utils/roomAvailability
 */

import Booking from '../models/Booking.js';

/**
 * Check if a room is available for a given date range
 * Excludes bookings that are cancelled or checked_out
 * @param {mongoose.Types.ObjectId} roomId - Room ID to check
 * @param {Date} checkInDate - Check-in date
 * @param {Date} checkOutDate - Check-out date
 * @param {mongoose.Types.ObjectId} excludeBookingId - Optional booking ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if room is available, false otherwise
 */
export const isRoomAvailable = async (roomId, checkInDate, checkOutDate, excludeBookingId = null) => {
  // Validate dates
  if (!checkInDate || !checkOutDate) {
    return false;
  }

  if (checkOutDate <= checkInDate) {
    return false;
  }

  // Find conflicting bookings
  // A booking conflicts if:
  // 1. It's not cancelled or checked_out
  // 2. The date ranges overlap
  const conflictingBookings = await Booking.find({
    room: roomId,
    status: { $nin: ['cancelled', 'checked_out'] },
    $or: [
      // Check-in date falls within existing booking
      {
        checkInDate: { $lte: checkInDate },
        checkOutDate: { $gt: checkInDate },
      },
      // Check-out date falls within existing booking
      {
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gte: checkOutDate },
      },
      // Existing booking is completely within requested range
      {
        checkInDate: { $gte: checkInDate },
        checkOutDate: { $lte: checkOutDate },
      },
    ],
  });

  // If excludeBookingId is provided, filter it out
  const relevantBookings = excludeBookingId
    ? conflictingBookings.filter(
        (booking) => booking._id.toString() !== excludeBookingId.toString()
      )
    : conflictingBookings;

  return relevantBookings.length === 0;
};

/**
 * Get all booked room IDs for a given date range
 * @param {Date} checkInDate - Check-in date
 * @param {Date} checkOutDate - Check-out date
 * @returns {Promise<string[]>} Array of room IDs that are booked
 */
export const getBookedRoomIds = async (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return [];
  }

  const bookings = await Booking.find({
    status: { $nin: ['cancelled', 'checked_out'] },
    $or: [
      {
        checkInDate: { $lte: checkInDate },
        checkOutDate: { $gt: checkInDate },
      },
      {
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gte: checkOutDate },
      },
      {
        checkInDate: { $gte: checkInDate },
        checkOutDate: { $lte: checkOutDate },
      },
    ],
  }).select('room');

  return bookings.map((booking) => booking.room.toString());
};

