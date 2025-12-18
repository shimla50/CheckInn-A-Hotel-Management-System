/**
 * @fileoverview Feedback routes
 * @module routes/feedbackRoutes
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createFeedback,
  listFeedback,
  getMyFeedback,
  respondToFeedback,
} from '../controllers/feedbackController.js';

const router = express.Router();

// Validation schemas
const createFeedbackSchema = {
  rating: {
    type: 'number',
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: 'string',
    required: false,
    maxLength: 1000,
  },
  bookingId: {
    type: 'string',
    required: false,
  },
};

const respondToFeedbackSchema = {
  response: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 1000,
  },
};

/**
 * @route POST /api/feedback
 * @desc Create feedback (customer)
 * @access Private (Customer)
 */
router.post(
  '/',
  protect,
  authorize('customer'),
  validate(createFeedbackSchema),
  createFeedback
);

/**
 * @route GET /api/feedback/my-feedback
 * @desc Get current user's feedback
 * @access Private (Customer)
 */
router.get('/my-feedback', protect, authorize('customer'), getMyFeedback);

/**
 * @route GET /api/feedback
 * @desc List all feedback with filters (admin/staff)
 * @access Private (Staff/Admin)
 */
router.get('/', protect, authorize('staff', 'admin'), listFeedback);

/**
 * @route POST /api/feedback/:id/respond
 * @desc Respond to feedback (admin/staff)
 * @access Private (Staff/Admin)
 */
router.post(
  '/:id/respond',
  protect,
  authorize('staff', 'admin'),
  validate(respondToFeedbackSchema),
  respondToFeedback
);

export default router;

