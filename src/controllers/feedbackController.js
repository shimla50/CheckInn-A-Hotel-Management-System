/**
 * @fileoverview Feedback controller for customer feedback management
 * @module controllers/feedbackController
 */

import Feedback from '../models/Feedback.js';
import Booking from '../models/Booking.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Create feedback
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const createFeedback = async (req, res, next) => {
  try {
    const { rating, comment, bookingId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!rating) {
      return res.status(400).json(
        errorResponse('Rating is required', null, 400)
      );
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(
        errorResponse('Rating must be between 1 and 5', null, 400)
      );
    }

    // Validate booking if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json(
          errorResponse('Booking not found', null, 404)
        );
      }

      // Check if booking belongs to user
      if (booking.guest.toString() !== userId) {
        return res.status(403).json(
          errorResponse('You can only provide feedback for your own bookings', null, 403)
        );
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      customer: userId,
      booking: bookingId || undefined,
      rating,
      comment: comment || '',
    });

    // Populate customer details
    await feedback.populate('customer', 'name email');
    if (bookingId) {
      await feedback.populate('booking', 'room checkInDate checkOutDate');
    }

    res.status(201).json(
      successResponse('Feedback submitted successfully', { feedback }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List feedback with filters (for admin/staff)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listFeedback = async (req, res, next) => {
  try {
    const { rating, startDate, endDate, hasResponse, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (rating) {
      filter.rating = Number(rating);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (hasResponse === 'true') {
      filter.responseFromStaff = { $exists: true, $ne: null, $ne: '' };
    } else if (hasResponse === 'false') {
      filter.$or = [
        { responseFromStaff: { $exists: false } },
        { responseFromStaff: null },
        { responseFromStaff: '' },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const feedbacks = await Feedback.find(filter)
      .populate('customer', 'name email')
      .populate('booking', 'room checkInDate checkOutDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Feedback.countDocuments(filter);

    res.status(200).json(
      successResponse('Feedback retrieved successfully', {
        feedbacks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback for current user (customer)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMyFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const feedbacks = await Feedback.find({ customer: userId })
      .populate('booking', 'room checkInDate checkOutDate')
      .sort({ createdAt: -1 });

    res.status(200).json(
      successResponse('Feedback retrieved successfully', { feedbacks }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to feedback (admin/staff only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const respondToFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim() === '') {
      return res.status(400).json(
        errorResponse('Response is required', null, 400)
      );
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json(
        errorResponse('Feedback not found', null, 404)
      );
    }

    feedback.responseFromStaff = response.trim();
    await feedback.save();

    // Populate details
    await feedback.populate('customer', 'name email');
    if (feedback.booking) {
      await feedback.populate('booking', 'room checkInDate checkOutDate');
    }

    res.status(200).json(
      successResponse('Response added successfully', { feedback }, 200)
    );
  } catch (error) {
    next(error);
  }
};

