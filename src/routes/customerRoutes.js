/**
 * @fileoverview Customer routes
 * @module routes/customerRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCustomerBookingsSummary } from '../controllers/customerController.js';

const router = express.Router();

/**
 * @route GET /api/customer/my-bookings/summary
 * @desc Get customer bookings summary
 * @access Private (Customer)
 */
router.get('/my-bookings/summary', protect, authorize('customer'), getCustomerBookingsSummary);

export default router;

