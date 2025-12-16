/**
 * @fileoverview Booking controller for booking management operations
 * @module controllers/bookingController
 */

import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';
import { isRoomAvailable, getBookedRoomIds } from '../utils/roomAvailability.js';
import {
  sendBookingConfirmation,
  sendBookingApproved,
} from '../services/notificationService.js';

/**
 * Create a new booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const createBooking = async (req, res, next) => {
  try {
    const { roomId, checkInDate, checkOutDate, numberOfGuests } = req.body;
    const userId = req.user.id;

    // Validation
    if (!roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json(
        errorResponse('Please provide roomId, checkInDate, and checkOutDate', null, 400)
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json(
        errorResponse('Check-out date must be after check-in date', null, 400)
      );
    }

    // Check if check-in date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return res.status(400).json(
        errorResponse('Check-in date cannot be in the past', null, 400)
      );
    }

    // Get room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json(
        errorResponse('Room not found', null, 404)
      );
    }

    // Check if room is in maintenance
    if (room.status === 'maintenance') {
      return res.status(400).json(
        errorResponse('Room is currently under maintenance', null, 400)
      );
    }

    // Check number of guests
    if (numberOfGuests && numberOfGuests > room.maxGuests) {
      return res.status(400).json(
        errorResponse(`Room can accommodate maximum ${room.maxGuests} guests`, null, 400)
      );
    }

    // Check room availability
    const available = await isRoomAvailable(roomId, checkIn, checkOut);
    if (!available) {
      return res.status(400).json(
        errorResponse('Room is not available for the selected dates', null, 400)
      );
    }

    // Calculate total nights and amount
    const oneDay = 24 * 60 * 60 * 1000;
    const totalNights = Math.ceil((checkOut - checkIn) / oneDay);
    const totalAmount = room.pricePerNight * totalNights;

    // Business rule: Customer bookings start as 'pending', staff/admin can create 'approved'
    const initialStatus = req.user.role === 'customer' ? 'pending' : 'approved';

    // Create booking
    const booking = await Booking.create({
      guest: userId,
      room: roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalNights,
      totalAmount,
      status: initialStatus,
      createdBy: userId,
    });

    // Populate room and guest details
    await booking.populate('room', 'code type pricePerNight amenities maxGuests');
    await booking.populate('guest', 'name email');
    await booking.populate('createdBy', 'name email role');

    // Send notification if booking is approved
    if (initialStatus === 'approved') {
      try {
        await sendBookingConfirmation(booking.guest, booking);
      } catch (notifError) {
        console.error('Failed to send booking confirmation notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json(
      successResponse('Booking created successfully', { booking }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a booking (only before approval/check-in)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roomId, checkInDate, checkOutDate } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Check permissions: customer can only update their own bookings
    if (req.user.role === 'customer' && booking.guest.toString() !== userId) {
      return res.status(403).json(
        errorResponse('You can only update your own bookings', null, 403)
      );
    }

    // Can only update if status is pending or approved (not checked_in or checked_out)
    if (['checked_in', 'checked_out'].includes(booking.status)) {
      return res.status(400).json(
        errorResponse('Cannot update booking that is already checked in or checked out', null, 400)
      );
    }

    let room = booking.room;
    let checkIn = booking.checkInDate;
    let checkOut = booking.checkOutDate;

    // Update room if provided
    if (roomId) {
      const newRoom = await Room.findById(roomId);
      if (!newRoom) {
        return res.status(404).json(
          errorResponse('Room not found', null, 404)
        );
      }
      if (newRoom.status === 'maintenance') {
        return res.status(400).json(
          errorResponse('Selected room is under maintenance', null, 400)
        );
      }
      room = newRoom._id;
    }

    // Update dates if provided
    if (checkInDate) {
      checkIn = new Date(checkInDate);
    }
    if (checkOutDate) {
      checkOut = new Date(checkOutDate);
    }

    if (checkOut <= checkIn) {
      return res.status(400).json(
        errorResponse('Check-out date must be after check-in date', null, 400)
      );
    }

    // Check availability (exclude current booking)
    const available = await isRoomAvailable(
      room.toString(),
      checkIn,
      checkOut,
      booking._id
    );

    if (!available) {
      return res.status(400).json(
        errorResponse('Room is not available for the selected dates', null, 400)
      );
    }

    // Update booking
    booking.room = room;
    booking.checkInDate = checkIn;
    booking.checkOutDate = checkOut;

    // Recalculate total nights and amount
    const oneDay = 24 * 60 * 60 * 1000;
    booking.totalNights = Math.ceil((checkOut - checkIn) / oneDay);
    
    // Get room price
    const roomData = await Room.findById(room);
    booking.totalAmount = roomData.pricePerNight * booking.totalNights;

    await booking.save();

    // Populate details
    await booking.populate('room', 'code type pricePerNight amenities maxGuests');
    await booking.populate('guest', 'name email');
    await booking.populate('createdBy', 'name email role');

    res.status(200).json(
      successResponse('Booking updated successfully', { booking }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Check permissions
    const isCustomer = req.user.role === 'customer';
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    const isOwner = booking.guest.toString() === userId;

    // Customers can only cancel their own bookings if not checked in
    if (isCustomer && !isOwner) {
      return res.status(403).json(
        errorResponse('You can only cancel your own bookings', null, 403)
      );
    }

    if (isCustomer && booking.status === 'checked_in') {
      return res.status(400).json(
        errorResponse('Cannot cancel booking that is already checked in', null, 400)
      );
    }

    // Staff/Admin can force cancel any booking
    if (!isStaffOrAdmin && booking.status === 'checked_in') {
      return res.status(400).json(
        errorResponse('Cannot cancel booking that is already checked in', null, 400)
      );
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Populate details
    await booking.populate('room', 'code type');
    await booking.populate('guest', 'name email');

    res.status(200).json(
      successResponse('Booking cancelled successfully', { booking }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List bookings for the current user (customer)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listBookingsForUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { guest: userId };

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(filter)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    res.status(200).json(
      successResponse('Bookings retrieved successfully', {
        bookings,
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
 * List all bookings (for staff/admin) with filters
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listAllBookings = async (req, res, next) => {
  try {
    const {
      status,
      checkInDate,
      checkOutDate,
      roomId,
      guestId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (roomId) {
      filter.room = roomId;
    }

    if (guestId) {
      filter.guest = guestId;
    }

    if (checkInDate) {
      filter.checkInDate = { $gte: new Date(checkInDate) };
    }
    if (checkOutDate) {
      filter.checkOutDate = { $lte: new Date(checkOutDate) };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(filter)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    res.status(200).json(
      successResponse('Bookings retrieved successfully', {
        bookings,
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
 * Approve a booking (staff/admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    if (booking.status !== 'pending') {
      return res.status(400).json(
        errorResponse(`Cannot approve booking with status: ${booking.status}`, null, 400)
      );
    }

    // Check room availability before approving
    const available = await isRoomAvailable(
      booking.room.toString(),
      booking.checkInDate,
      booking.checkOutDate,
      booking._id
    );

    if (!available) {
      return res.status(400).json(
        errorResponse('Room is no longer available for the selected dates', null, 400)
      );
    }

    booking.status = 'approved';
    await booking.save();

    // Populate details
    await booking.populate('room', 'code type pricePerNight amenities maxGuests');
    await booking.populate('guest', 'name email');
    await booking.populate('createdBy', 'name email role');

    // Send booking approved notification
    try {
      await sendBookingApproved(booking.guest, booking);
    } catch (notifError) {
      console.error('Failed to send booking approved notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json(
      successResponse('Booking approved successfully', { booking }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Check permissions: customers can only view their own bookings
    if (req.user.role === 'customer' && booking.guest.toString() !== userId) {
      return res.status(403).json(
        errorResponse('You can only view your own bookings', null, 403)
      );
    }

    res.status(200).json(
      successResponse('Booking retrieved successfully', { booking }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Check-in a guest
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const checkInGuest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Validate booking status
    if (booking.status !== 'approved') {
      return res.status(400).json(
        errorResponse(`Cannot check in booking with status: ${booking.status}. Booking must be approved.`, null, 400)
      );
    }

    // Validate check-in date: today should be within check-in range (allow early check-in up to 1 day before)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(booking.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(booking.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);

    // Allow check-in from 1 day before check-in date up to check-out date
    const oneDayBefore = new Date(checkInDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);

    if (today < oneDayBefore) {
      return res.status(400).json(
        errorResponse('Check-in is only allowed from 1 day before the scheduled check-in date', null, 400)
      );
    }

    if (today >= checkOutDate) {
      return res.status(400).json(
        errorResponse('Cannot check in: check-out date has passed', null, 400)
      );
    }

    // Update booking status
    booking.status = 'checked_in';
    await booking.save();

    // Generate stay card
    const stayCard = {
      bookingId: booking._id,
      guest: {
        name: booking.guest.name,
        email: booking.guest.email,
      },
      room: {
        code: booking.room.code,
        type: booking.room.type,
        amenities: booking.room.amenities,
      },
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalNights: booking.totalNights,
      totalAmount: booking.totalAmount,
      checkedInAt: new Date(),
    };

    res.status(200).json(
      successResponse('Guest checked in successfully', {
        booking,
        stayCard,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Check-out a guest
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const checkOutGuest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('room', 'code type pricePerNight amenities maxGuests status')
      .populate('guest', 'name email');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Validate booking status
    if (booking.status !== 'checked_in') {
      return res.status(400).json(
        errorResponse(`Cannot check out booking with status: ${booking.status}. Guest must be checked in first.`, null, 400)
      );
    }

    // Update booking status
    booking.status = 'checked_out';
    await booking.save();

    // Check if room can be marked as available
    // Only mark as available if there are no overlapping bookings
    const roomId = booking.room._id;
    const hasOverlappingBookings = await Booking.findOne({
      room: roomId,
      status: { $nin: ['cancelled', 'checked_out'] },
      $or: [
        {
          checkInDate: { $lte: booking.checkOutDate },
          checkOutDate: { $gt: booking.checkOutDate },
        },
      ],
    });

    // Update room status if no overlapping bookings
    if (!hasOverlappingBookings) {
      const room = await Room.findById(roomId);
      if (room && room.status === 'booked') {
        room.status = 'available';
        await room.save();
      }
    }

    res.status(200).json(
      successResponse('Guest checked out successfully', { booking }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get front desk overview - today's arrivals, in-house guests, and departures
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getFrontDeskOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's arrivals: approved bookings with check-in date today
    const arrivals = await Booking.find({
      status: 'approved',
      checkInDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ checkInDate: 1 });

    // In-house guests: currently checked in
    const inHouse = await Booking.find({
      status: 'checked_in',
    })
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ checkInDate: 1 });

    // Today's departures: checked in guests with check-out date today
    const departures = await Booking.find({
      status: 'checked_in',
      checkOutDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ checkOutDate: 1 });

    res.status(200).json(
      successResponse('Front desk overview retrieved successfully', {
        date: today,
        arrivals: {
          count: arrivals.length,
          bookings: arrivals,
        },
        inHouse: {
          count: inHouse.length,
          bookings: inHouse,
        },
        departures: {
          count: departures.length,
          bookings: departures,
        },
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

