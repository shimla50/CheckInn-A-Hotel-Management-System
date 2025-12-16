/**
 * @fileoverview Reports routes for admin analytics
 * @module routes/reportsRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getRevenueSummary,
  getOccupancyStats,
  getTopServices,
} from '../controllers/reportsController.js';

const router = express.Router();

/**
 * @route GET /api/admin/reports/revenue
 * @desc Get revenue summary (daily/weekly/monthly)
 * @access Private (Admin only)
 */
router.get('/revenue', protect, authorize('admin'), getRevenueSummary);

/**
 * @route GET /api/admin/reports/occupancy
 * @desc Get occupancy statistics
 * @access Private (Admin only)
 */
router.get('/occupancy', protect, authorize('admin'), getOccupancyStats);

/**
 * @route GET /api/admin/reports/top-services
 * @desc Get top services by revenue
 * @access Private (Admin only)
 */
router.get('/top-services', protect, authorize('admin'), getTopServices);

export default router;

