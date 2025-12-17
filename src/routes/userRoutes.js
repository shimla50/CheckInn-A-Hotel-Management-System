/**
 * @fileoverview User routes
 * @module routes/userRoutes
 */

import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMe } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route GET /api/users/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get('/me', protect, getMe);

export default router;

