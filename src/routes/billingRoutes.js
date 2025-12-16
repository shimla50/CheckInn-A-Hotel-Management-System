/**
 * @fileoverview Billing routes
 * @module routes/billingRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateInvoiceForBooking,
  recordPayment,
  getPaymentHistory,
} from '../controllers/billingController.js';

const router = express.Router();

/**
 * @route GET /api/billing/bookings/:bookingId/invoice
 * @desc Generate invoice for a booking
 * @access Private (Staff/Admin)
 */
router.get(
  '/bookings/:bookingId/invoice',
  protect,
  authorize('staff', 'admin'),
  generateInvoiceForBooking
);

/**
 * @route POST /api/billing/bookings/:bookingId/payment
 * @desc Record a payment for a booking
 * @access Private (Staff/Admin)
 */
router.post(
  '/bookings/:bookingId/payment',
  protect,
  authorize('staff', 'admin'),
  recordPayment
);

/**
 * @route GET /api/billing/bookings/:bookingId/payments
 * @desc Get payment history for a booking
 * @access Private (Staff/Admin)
 */
router.get(
  '/bookings/:bookingId/payments',
  protect,
  authorize('staff', 'admin'),
  getPaymentHistory
);

export default router;

