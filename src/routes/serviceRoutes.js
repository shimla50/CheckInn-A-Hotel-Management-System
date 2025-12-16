/**
 * @fileoverview Service routes
 * @module routes/serviceRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createService,
  updateService,
  deleteService,
  listServices,
} from '../controllers/serviceController.js';

const router = express.Router();

/**
 * @route GET /api/services
 * @desc List services
 * @access Public (customers) / Private (staff/admin)
 */
router.get('/', listServices);

/**
 * @route POST /api/services
 * @desc Create a new service
 * @access Private (Admin only)
 */
router.post('/', protect, authorize('admin'), createService);

/**
 * @route PUT /api/services/:id
 * @desc Update a service
 * @access Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), updateService);

/**
 * @route DELETE /api/services/:id
 * @desc Delete a service
 * @access Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deleteService);

export default router;

