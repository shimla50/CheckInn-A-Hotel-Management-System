/**
 * @fileoverview Admin routes
 * @module routes/adminRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAdminSummary,
  listAllUsers,
  updateUserRole,
  updateUserStatus,
  getSettings,
  updateSettings,
  createStaff,
  listStaff,
  listPayments,
  sendCheckInReminders,
  sendPromotionEmails,
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * @route GET /api/admin/summary
 * @desc Get admin summary statistics
 * @access Private (Admin only)
 */
router.get('/summary', protect, authorize('admin'), getAdminSummary);

/**
 * @route GET /api/admin/users
 * @desc List all users
 * @access Private (Admin only)
 */
router.get('/users', protect, authorize('admin'), listAllUsers);

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Update user role
 * @access Private (Admin only)
 */
router.patch('/users/:id/role', protect, authorize('admin'), updateUserRole);

/**
 * @route PATCH /api/admin/users/:id/status
 * @desc Update user status (activate/deactivate)
 * @access Private (Admin only)
 */
router.patch('/users/:id/status', protect, authorize('admin'), updateUserStatus);

/**
 * @route GET /api/admin/settings
 * @desc Get system settings
 * @access Private (Admin only)
 */
router.get('/settings', protect, authorize('admin'), getSettings);

/**
 * @route PATCH /api/admin/settings
 * @desc Update system settings
 * @access Private (Admin only)
 */
router.patch('/settings', protect, authorize('admin'), updateSettings);

/**
 * @route POST /api/admin/staff
 * @desc Create a new staff account
 * @access Private (Admin only)
 */
router.post('/staff', protect, authorize('admin'), createStaff);

/**
 * @route GET /api/admin/staff
 * @desc List all staff accounts
 * @access Private (Admin only)
 */
router.get('/staff', protect, authorize('admin'), listStaff);

/**
 * @route GET /api/admin/payments
 * @desc List all payment transactions
 * @access Private (Admin only)
 */
router.get('/payments', protect, authorize('admin'), listPayments);

/**
 * @route POST /api/admin/notifications/send-checkin-reminders
 * @desc Send check-in reminders for tomorrow's bookings
 * @access Private (Admin/Staff)
 */
router.post('/notifications/send-checkin-reminders', protect, authorize('admin', 'staff'), sendCheckInReminders);

/**
 * @route POST /api/admin/notifications/send-promotion
 * @desc Send promotion email to customers
 * @access Private (Admin only)
 */
router.post('/notifications/send-promotion', protect, authorize('admin'), sendPromotionEmails);

export default router;

