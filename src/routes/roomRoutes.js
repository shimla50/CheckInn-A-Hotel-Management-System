/**
 * @fileoverview Room routes
 * @module routes/roomRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  listRooms,
  getAvailabilityForDateRange,
} from '../controllers/roomController.js';

const router = express.Router();

/**
 * @route GET /api/rooms
 * @desc List rooms with filters (public for customers, protected for staff/admin)
 * @access Public (customers) / Private (staff/admin)
 */
router.get('/', listRooms);

/**
 * @route GET /api/rooms/availability
 * @desc Get room availability for date range
 * @access Public
 */
router.get('/availability', getAvailabilityForDateRange);

/**
 * @route GET /api/rooms/:id
 * @desc Get room by ID
 * @access Public
 */
router.get('/:id', getRoomById);

/**
 * @route POST /api/rooms
 * @desc Create a new room
 * @access Private (Admin only)
 */
router.post('/', protect, authorize('admin'), createRoom);

/**
 * @route PUT /api/rooms/:id
 * @desc Update a room
 * @access Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), updateRoom);

/**
 * @route DELETE /api/rooms/:id
 * @desc Delete a room
 * @access Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deleteRoom);

export default router;

