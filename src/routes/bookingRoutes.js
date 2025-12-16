/**
 * @fileoverview Booking routes
 * @module routes/bookingRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createBooking,
  updateBooking,
  cancelBooking,
  listBookingsForUser,
  listAllBookings,
  approveBooking,
  getBookingById,
  checkInGuest,
  checkOutGuest,
  getFrontDeskOverview,
} from '../controllers/bookingController.js';

const router = express.Router();

/**
 * @route GET /api/bookings/my-bookings
 * @desc Get current user's bookings (customer)
 * @access Private (Customer)
 */
router.get('/my-bookings', protect, authorize('customer'), listBookingsForUser);

/**
 * @route GET /api/bookings
 * @desc List all bookings with filters (staff/admin)
 * @access Private (Staff/Admin)
 */
router.get('/', protect, authorize('staff', 'admin'), listAllBookings);

/**
 * @route GET /api/bookings/:id
 * @desc Get booking by ID
 * @access Private
 */
router.get('/:id', protect, getBookingById);

/**
 * @route POST /api/bookings
 * @desc Create a new booking
 * @access Private
 */
router.post('/', protect, createBooking);

/**
 * @route PUT /api/bookings/:id
 * @desc Update a booking
 * @access Private
 */
router.put('/:id', protect, updateBooking);

/**
 * @route POST /api/bookings/:id/approve
 * @desc Approve a booking
 * @access Private (Staff/Admin)
 */
router.post('/:id/approve', protect, authorize('staff', 'admin'), approveBooking);

/**
 * @route POST /api/bookings/:id/cancel
 * @desc Cancel a booking
 * @access Private
 */
router.post('/:id/cancel', protect, cancelBooking);

/**
 * @route GET /api/bookings/front-desk/overview
 * @desc Get front desk overview (arrivals, in-house, departures)
 * @access Private (Staff/Admin)
 */
router.get('/front-desk/overview', protect, authorize('staff', 'admin'), getFrontDeskOverview);

/**
 * @route POST /api/bookings/:id/check-in
 * @desc Check-in a guest
 * @access Private (Staff/Admin)
 */
router.post('/:id/check-in', protect, authorize('staff', 'admin'), checkInGuest);

/**
 * @route POST /api/bookings/:id/check-out
 * @desc Check-out a guest
 * @access Private (Staff/Admin)
 */
router.post('/:id/check-out', protect, authorize('staff', 'admin'), checkOutGuest);

export default router;

