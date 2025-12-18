/**
 * @fileoverview Service usage controller for managing services attached to bookings
 * @module controllers/serviceUsageController
 */

import ServiceUsage from '../models/ServiceUsage.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Get service usages for a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getServiceUsagesByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    const serviceUsages = await ServiceUsage.find({ booking: bookingId })
      .populate('service', 'name description price isActive')
      .sort({ createdAt: -1 });

    res.status(200).json(
      successResponse('Service usages retrieved successfully', {
        serviceUsages,
        booking: {
          id: booking._id,
          status: booking.status,
        },
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add a service to a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const addServiceToBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { serviceId, quantity } = req.body;

    if (!serviceId || !quantity) {
      return res.status(400).json(
        errorResponse('Please provide serviceId and quantity', null, 400)
      );
    }

    if (quantity < 1) {
      return res.status(400).json(
        errorResponse('Quantity must be at least 1', null, 400)
      );
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Check if booking is in a valid state
    if (['cancelled', 'checked_out'].includes(booking.status)) {
      return res.status(400).json(
        errorResponse('Cannot add services to cancelled or checked-out bookings', null, 400)
      );
    }

    // Check if service exists and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json(
        errorResponse('Service not found', null, 404)
      );
    }

    if (!service.isActive) {
      return res.status(400).json(
        errorResponse('Service is not active', null, 400)
      );
    }

    // Calculate amount
    const amount = service.price * quantity;

    // Create service usage
    const serviceUsage = await ServiceUsage.create({
      booking: bookingId,
      service: serviceId,
      quantity,
      amount,
    });

    // Populate service details
    await serviceUsage.populate('service', 'name description price');

    res.status(201).json(
      successResponse('Service added to booking successfully', {
        serviceUsage,
      }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a service usage from a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const removeServiceFromBooking = async (req, res, next) => {
  try {
    const { bookingId, usageId } = req.params;

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Check if booking is in a valid state
    if (['cancelled', 'checked_out'].includes(booking.status)) {
      return res.status(400).json(
        errorResponse('Cannot remove services from cancelled or checked-out bookings', null, 400)
      );
    }

    // Check if service usage exists and belongs to this booking
    const serviceUsage = await ServiceUsage.findOne({
      _id: usageId,
      booking: bookingId,
    });

    if (!serviceUsage) {
      return res.status(404).json(
        errorResponse('Service usage not found', null, 404)
      );
    }

    await ServiceUsage.findByIdAndDelete(usageId);

    res.status(200).json(
      successResponse('Service removed from booking successfully', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List all service usages (staff/admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listAllServiceUsages = async (req, res, next) => {
  try {
    const { bookingId, serviceId, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (bookingId) {
      filter.booking = bookingId;
    }

    if (serviceId) {
      filter.service = serviceId;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const serviceUsages = await ServiceUsage.find(filter)
      .populate('booking', 'checkInDate checkOutDate status')
      .populate('service', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ServiceUsage.countDocuments(filter);

    res.status(200).json(
      successResponse('Service usages retrieved successfully', {
        serviceUsages,
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

