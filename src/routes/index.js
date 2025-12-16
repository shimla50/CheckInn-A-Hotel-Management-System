/**
 * @fileoverview Route exports and main router configuration
 * @module routes
 */

import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import roomRoutes from './roomRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import billingRoutes from './billingRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import adminRoutes from './adminRoutes.js';
import staffRoutes from './staffRoutes.js';
import customerRoutes from './customerRoutes.js';
import serviceUsageRoutes from './serviceUsageRoutes.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Dashboard routes
router.use('/', dashboardRoutes);

// Room routes
router.use('/rooms', roomRoutes);

// Service routes
router.use('/services', serviceRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Billing routes
router.use('/billing', billingRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Admin reports routes
router.use('/admin/reports', reportsRoutes);

// Staff routes
router.use('/staff', staffRoutes);

// Customer routes
router.use('/customer', customerRoutes);

// Feedback routes
router.use('/feedback', feedbackRoutes);

// Service usage routes
router.use('/service-usage', serviceUsageRoutes);

export default router;

