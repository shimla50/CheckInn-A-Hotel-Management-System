/**
 * @fileoverview Service usage routes for managing services attached to bookings
 * @module routes/serviceUsageRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getServiceUsagesByBooking,
  addServiceToBooking,
  removeServiceFromBooking,
  listAllServiceUsages,
} from '../controllers/serviceUsageController.js';

const router = express.Router();

/**
 * @route GET /api/service-usage/booking/:bookingId
 * @desc Get service usages for a specific booking
 * @access Private (Staff/Admin/Customer - customer can only see their own bookings)
 */
router.get(
  '/booking/:bookingId',
  protect,
  getServiceUsagesByBooking
);

/**
 * @route POST /api/service-usage/booking/:bookingId
 * @desc Add a service to a booking
 * @access Private (Staff/Admin)
 */
router.post(
  '/booking/:bookingId',
  protect,
  authorize('staff', 'admin'),
  addServiceToBooking
);

/**
 * @route DELETE /api/service-usage/booking/:bookingId/usage/:usageId
 * @desc Remove a service usage from a booking
 * @access Private (Staff/Admin)
 */
router.delete(
  '/booking/:bookingId/usage/:usageId',
  protect,
  authorize('staff', 'admin'),
  removeServiceFromBooking
);

/**
 * @route GET /api/service-usage
 * @desc List all service usages with filters
 * @access Private (Staff/Admin)
 */
router.get(
  '/',
  protect,
  authorize('staff', 'admin'),
  listAllServiceUsages
);

export default router;

