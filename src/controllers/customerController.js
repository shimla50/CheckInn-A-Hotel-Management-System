/**
 * @fileoverview Customer controller for customer-specific operations
 * @module controllers/customerController
 */

import Booking from '../models/Booking.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Get customer bookings summary
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getCustomerBookingsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = 10; // Limit to latest 10 bookings

    // Get customer's bookings, sorted by checkInDate descending
    const bookings = await Booking.find({ guest: userId })
      .populate('room', 'code type')
      .sort({ checkInDate: -1 })
      .limit(limit)
      .select('_id room status checkInDate checkOutDate totalAmount')
      .lean();

    // Format bookings for response
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      room: {
        _id: booking.room?._id || null,
        number: booking.room?.code || 'N/A',
        type: booking.room?.type || 'N/A',
      },
      status: booking.status,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalAmount: booking.totalAmount || 0,
    }));

    res.status(200).json(
      successResponse('Customer bookings summary retrieved successfully', {
        bookings: formattedBookings,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

