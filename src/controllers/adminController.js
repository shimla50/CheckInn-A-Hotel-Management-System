/**
 * @fileoverview Admin controller for admin-specific operations
 * @module controllers/adminController
 */

import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Get admin summary statistics
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getAdminSummary = async (req, res, next) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments({});

    // Count total rooms
    const totalRooms = await Room.countDocuments({});

    // Count active bookings (pending, approved, checked_in)
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['pending', 'approved', 'checked_in'] },
    });

    // Calculate total revenue from paid payments
    const paidPayments = await Payment.find({ status: 'paid' });
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json(
      successResponse('Admin summary retrieved successfully', {
        totalUsers,
        totalRooms,
        activeBookings,
        totalRevenue,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List all users (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json(
      successResponse('Users retrieved successfully', {
        users,
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
 * Update user role (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'staff', 'customer'].includes(role)) {
      return res.status(400).json(
        errorResponse('Invalid role. Must be admin, staff, or customer', null, 400)
      );
    }

    // Prevent changing own role
    if (id === req.user.id) {
      return res.status(400).json(
        errorResponse('You cannot change your own role', null, 400)
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }

    user.role = role;
    await user.save();

    // Remove password from response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json(
      successResponse('User role updated successfully', { user: userData }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (activate/deactivate) (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json(
        errorResponse('isActive must be a boolean value', null, 400)
      );
    }

    // Prevent deactivating own account
    if (id === req.user.id && !isActive) {
      return res.status(400).json(
        errorResponse('You cannot deactivate your own account', null, 400)
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }

    user.isActive = isActive;
    await user.save();

    // Remove password from response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json(
      successResponse(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { user: userData }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get system settings (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json(
      successResponse('Settings retrieved successfully', { settings }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { defaultTaxRate, currencySymbol, defaultCheckInTime, defaultCheckOutTime } = req.body;

    const settings = await Settings.getSettings();

    // Update only provided fields
    if (defaultTaxRate !== undefined) {
      if (typeof defaultTaxRate !== 'number' || defaultTaxRate < 0 || defaultTaxRate > 100) {
        return res.status(400).json(
          errorResponse('defaultTaxRate must be a number between 0 and 100', null, 400)
        );
      }
      settings.defaultTaxRate = defaultTaxRate;
    }

    if (currencySymbol !== undefined) {
      if (typeof currencySymbol !== 'string' || currencySymbol.length > 5) {
        return res.status(400).json(
          errorResponse('currencySymbol must be a string with max 5 characters', null, 400)
        );
      }
      settings.currencySymbol = currencySymbol.trim();
    }

    if (defaultCheckInTime !== undefined) {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(defaultCheckInTime)) {
        return res.status(400).json(
          errorResponse('defaultCheckInTime must be in HH:mm format', null, 400)
        );
      }
      settings.defaultCheckInTime = defaultCheckInTime;
    }

    if (defaultCheckOutTime !== undefined) {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(defaultCheckOutTime)) {
        return res.status(400).json(
          errorResponse('defaultCheckOutTime must be in HH:mm format', null, 400)
        );
      }
      settings.defaultCheckOutTime = defaultCheckOutTime;
    }

    settings.updatedAt = new Date();
    await settings.save();

    res.status(200).json(
      successResponse('Settings updated successfully', { settings }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new staff account (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(
        errorResponse('Please provide name, email, and password', null, 400)
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        errorResponse('Password must be at least 6 characters', null, 400)
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json(
        errorResponse('User with this email already exists', null, 400)
      );
    }

    // Create staff user
    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'staff',
      isActive: true,
    });

    // Remove password from response
    const staffData = {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    };

    res.status(201).json(
      successResponse('Staff account created successfully', { staff: staffData }, 201)
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json(
        errorResponse('User with this email already exists', null, 400)
      );
    }
    next(error);
  }
};

/**
 * List all staff accounts (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listStaff = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;

    const filter = { role: 'staff' };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const staff = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json(
      successResponse('Staff accounts retrieved successfully', {
        staff,
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
 * List all payment transactions (admin only)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const listPayments = async (req, res, next) => {
  try {
    const {
      bookingId,
      status,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (bookingId) {
      filter.booking = bookingId;
    }

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const payments = await Payment.find(filter)
      .populate({
        path: 'booking',
        select: 'checkInDate checkOutDate totalAmount',
        populate: {
          path: 'guest',
          select: 'name email',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Payment.countDocuments(filter);

    // Calculate summary statistics
    const allPaymentsInFilter = await Payment.find(filter);
    const totalAmount = allPaymentsInFilter.reduce((sum, p) => sum + p.amount, 0);
    const paidCount = allPaymentsInFilter.filter((p) => p.status === 'paid').length;
    const pendingCount = allPaymentsInFilter.filter((p) => p.status === 'pending').length;
    const failedCount = allPaymentsInFilter.filter((p) => p.status === 'failed').length;

    res.status(200).json(
      successResponse('Payments retrieved successfully', {
        payments,
        summary: {
          totalAmount,
          totalCount: allPaymentsInFilter.length,
          paidCount,
          pendingCount,
          failedCount,
        },
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

