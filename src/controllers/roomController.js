/**
 * @fileoverview Room controller for room management operations
 * @module controllers/roomController
 */

import Room from '../models/Room.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';
import { isRoomAvailable, getBookedRoomIds } from '../utils/roomAvailability.js';

/**
 * Create a new room
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const createRoom = async (req, res, next) => {
  try {
    const { code, type, pricePerNight, amenities, status, maxGuests } = req.body;

    // Validation
    if (!code || !type || pricePerNight === undefined || !maxGuests) {
      return res.status(400).json(
        errorResponse('Please provide code, type, pricePerNight, and maxGuests', null, 400)
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if room code already exists
    const existingRoom = await Room.findOne({ code: normalizedCode });
    if (existingRoom) {
      return res.status(400).json(
        errorResponse('Room code already exists', null, 400)
      );
    }

    // Create room
    const room = await Room.create({
      code: normalizedCode,
      type,
      pricePerNight,
      amenities: amenities || [],
      status: status || 'available',
      maxGuests,
    });

    res.status(201).json(
      successResponse('Room created successfully', { room }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a room
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, type, pricePerNight, amenities, status, maxGuests } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json(
        errorResponse('Room not found', null, 404)
      );
    }

    // Check if code is being changed and if new code already exists
    if (code && code.trim().toUpperCase() !== room.code) {
      const normalizedCode = code.trim().toUpperCase();
      const existingRoom = await Room.findOne({
        code: normalizedCode,
        _id: { $ne: room._id },
      });
      if (existingRoom) {
        return res.status(400).json(
          errorResponse('Room code already exists', null, 400)
        );
      }
      room.code = normalizedCode;
    }

    // Update fields
    if (type) room.type = type;
    if (pricePerNight !== undefined) room.pricePerNight = pricePerNight;
    if (amenities !== undefined) room.amenities = amenities;
    if (status) room.status = status;
    if (maxGuests !== undefined) room.maxGuests = maxGuests;

    await room.save();

    res.status(200).json(
      successResponse('Room updated successfully', { room }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a room
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json(
        errorResponse('Room not found', null, 404)
      );
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json(
      successResponse('Room deleted successfully', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get room by ID
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json(
        errorResponse('Room not found', null, 404)
      );
    }

    res.status(200).json(
      successResponse('Room retrieved successfully', { room }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List rooms with filters
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listRooms = async (req, res, next) => {
  try {
    const {
      type,
      minPrice,
      maxPrice,
      amenities,
      status,
      checkInDate,
      checkOutDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerNight = {};
      if (minPrice !== undefined) {
        filter.pricePerNight.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.pricePerNight.$lte = Number(maxPrice);
      }
    }

    if (amenities) {
      // If amenities is a string, split by comma; if array, use as is
      const amenityArray = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim());
      filter.amenities = { $all: amenityArray };
    }

    if (status) {
      filter.status = status;
    }

    // If date range is provided, exclude booked rooms
    let excludeRoomIds = [];
    if (checkInDate && checkOutDate) {
      excludeRoomIds = await getBookedRoomIds(
        new Date(checkInDate),
        new Date(checkOutDate)
      );
      if (excludeRoomIds.length > 0) {
        filter._id = { $nin: excludeRoomIds };
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const rooms = await Room.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Room.countDocuments(filter);

    res.status(200).json(
      successResponse('Rooms retrieved successfully', {
        rooms,
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
 * Get room availability for a date range
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getAvailabilityForDateRange = async (req, res, next) => {
  try {
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json(
        errorResponse('Please provide checkInDate and checkOutDate', null, 400)
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json(
        errorResponse('Check-out date must be after check-in date', null, 400)
      );
    }

    // Get all available rooms (not in maintenance)
    const allRooms = await Room.find({ status: { $ne: 'maintenance' } });

    // Get booked room IDs for the date range
    const bookedRoomIds = await getBookedRoomIds(checkIn, checkOut);

    // Filter available rooms
    const availableRooms = allRooms.filter(
      (room) => !bookedRoomIds.includes(room._id.toString())
    );

    res.status(200).json(
      successResponse('Availability retrieved successfully', {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        availableRooms,
        totalAvailable: availableRooms.length,
        totalRooms: allRooms.length,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

