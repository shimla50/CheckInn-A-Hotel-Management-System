/**
 * @fileoverview Dashboard routes for different user roles
 * @module routes/dashboardRoutes
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';
import { successResponse } from '../utils/ApiResponse.js';

const router = express.Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Admin dashboard
 * @access Private (Admin only)
 */
router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => {
  res.status(200).json(
    successResponse('Admin dashboard accessed successfully', {
      message: 'Welcome to Admin Dashboard',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      dashboard: {
        type: 'admin',
        features: [
          'Manage all users',
          'Manage rooms',
          'View all bookings',
          'Generate reports',
          'System settings',
        ],
      },
    }, 200)
  );
});

/**
 * @route GET /api/staff/dashboard
 * @desc Staff dashboard
 * @access Private (Staff only)
 */
router.get('/staff/dashboard', protect, authorize('staff'), (req, res) => {
  res.status(200).json(
    successResponse('Staff dashboard accessed successfully', {
      message: 'Welcome to Staff Dashboard',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      dashboard: {
        type: 'staff',
        features: [
          'Manage bookings',
          'Check-in/Check-out guests',
          'View room availability',
          'Handle customer inquiries',
        ],
      },
    }, 200)
  );
});

/**
 * @route GET /api/customer/dashboard
 * @desc Customer dashboard
 * @access Private (Customer only)
 */
router.get('/customer/dashboard', protect, authorize('customer'), (req, res) => {
  res.status(200).json(
    successResponse('Customer dashboard accessed successfully', {
      message: 'Welcome to Customer Dashboard',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      dashboard: {
        type: 'customer',
        features: [
          'View bookings',
          'Make new bookings',
          'View booking history',
          'Update profile',
          'Leave feedback',
        ],
      },
    }, 200)
  );
});

export default router;

