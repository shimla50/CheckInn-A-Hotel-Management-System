/**
 * @fileoverview Staff routes
 * @module routes/staffRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getStaffTasksToday } from '../controllers/staffController.js';

const router = express.Router();

/**
 * @route GET /api/staff/tasks-today
 * @desc Get staff tasks for today
 * @access Private (Staff/Admin)
 */
router.get('/tasks-today', protect, authorize('staff', 'admin'), getStaffTasksToday);

export default router;

