/**
 * @fileoverview Staff controller for staff-specific operations
 * @module controllers/staffController
 */

import Booking from '../models/Booking.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Get staff tasks for today
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getStaffTasksToday = async (req, res, next) => {
  try {
    // Get today's date range (00:00:00 to 23:59:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count check-ins today (approved bookings with checkInDate today)
    const checkInsToday = await Booking.countDocuments({
      status: 'approved',
      checkInDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Count check-outs today (bookings with checkOutDate today)
    const checkOutsToday = await Booking.countDocuments({
      checkOutDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Count pending bookings
    const pendingBookings = await Booking.countDocuments({
      status: 'pending',
    });

    res.status(200).json(
      successResponse('Staff tasks retrieved successfully', {
        checkInsToday,
        checkOutsToday,
        pendingBookings,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

