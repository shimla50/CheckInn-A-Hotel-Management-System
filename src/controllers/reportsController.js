/**
 * @fileoverview Reports controller for revenue, occupancy, and service analytics
 * @module controllers/reportsController
 */

import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import ServiceUsage from '../models/ServiceUsage.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';

/**
 * Get revenue summary (daily, weekly, monthly)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getRevenueSummary = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let start, end;
    const now = new Date();

    // Set date range based on period or custom dates
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Get all paid payments in the date range
    const payments = await Payment.find({
      status: 'paid',
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Revenue by payment method
    const revenueByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      acc[method] = (acc[method] || 0) + payment.amount;
      return acc;
    }, {});

    // Daily breakdown for the period
    const dailyBreakdown = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayPayments = payments.filter(
        (p) => p.createdAt >= dayStart && p.createdAt <= dayEnd
      );
      const dayRevenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);

      dailyBreakdown.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        revenue: dayRevenue,
        transactionCount: dayPayments.length,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json(
      successResponse('Revenue summary retrieved successfully', {
        period,
        startDate: start,
        endDate: end,
        totalRevenue,
        revenueByMethod,
        dailyBreakdown,
        transactionCount: payments.length,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get occupancy statistics
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getOccupancyStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        errorResponse('Please provide startDate and endDate', null, 400)
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end <= start) {
      return res.status(400).json(
        errorResponse('End date must be after start date', null, 400)
      );
    }

    // Get total number of rooms (excluding maintenance)
    const totalRooms = await Room.countDocuments({
      status: { $ne: 'maintenance' },
    });

    if (totalRooms === 0) {
      return res.status(200).json(
        successResponse('Occupancy stats retrieved successfully', {
          startDate: start,
          endDate: end,
          totalRooms: 0,
          bookedRoomNights: 0,
          totalRoomNights: 0,
          occupancyPercentage: 0,
        }, 200)
      );
    }

    // Calculate number of days in range
    const oneDay = 24 * 60 * 60 * 1000;
    const daysInRange = Math.ceil((end - start) / oneDay);
    const totalRoomNights = totalRooms * daysInRange;

    // Get bookings that overlap with the date range (excluding cancelled)
    const bookings = await Booking.find({
      status: { $nin: ['cancelled'] },
      $or: [
        {
          checkInDate: { $lte: end },
          checkOutDate: { $gt: start },
        },
      ],
    });

    // Calculate booked room nights
    let bookedRoomNights = 0;
    bookings.forEach((booking) => {
      // Calculate overlap between booking dates and requested range
      const bookingStart = new Date(Math.max(booking.checkInDate.getTime(), start.getTime()));
      const bookingEnd = new Date(Math.min(booking.checkOutDate.getTime(), end.getTime()));
      
      if (bookingEnd > bookingStart) {
        const overlapDays = Math.ceil((bookingEnd - bookingStart) / oneDay);
        bookedRoomNights += overlapDays;
      }
    });

    const occupancyPercentage =
      totalRoomNights > 0 ? (bookedRoomNights / totalRoomNights) * 100 : 0;

    // Daily occupancy breakdown
    const dailyOccupancy = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Count rooms booked on this day
      const dayBookings = bookings.filter((booking) => {
        return (
          booking.checkInDate <= dayEnd &&
          booking.checkOutDate > dayStart &&
          booking.status !== 'cancelled'
        );
      });

      const dayOccupiedRooms = new Set(dayBookings.map((b) => b.room.toString())).size;
      const dayOccupancy = totalRooms > 0 ? (dayOccupiedRooms / totalRooms) * 100 : 0;

      dailyOccupancy.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        occupiedRooms: dayOccupiedRooms,
        totalRooms,
        occupancyPercentage: dayOccupancy,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json(
      successResponse('Occupancy stats retrieved successfully', {
        startDate: start,
        endDate: end,
        totalRooms,
        bookedRoomNights,
        totalRoomNights,
        occupancyPercentage: Math.round(occupancyPercentage * 100) / 100,
        dailyOccupancy,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get top services by revenue
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getTopServices = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const filter = {};

    // If date range provided, filter by booking dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get bookings in date range
      const bookings = await Booking.find({
        checkInDate: { $lte: end },
        checkOutDate: { $gt: start },
        status: { $nin: ['cancelled'] },
      }).select('_id');

      const bookingIds = bookings.map((b) => b._id);
      filter.booking = { $in: bookingIds };
    }

    // Aggregate service usage by service
    const serviceUsages = await ServiceUsage.find(filter).populate(
      'service',
      'name price'
    );

    // Group by service and calculate totals
    const serviceStats = {};
    serviceUsages.forEach((usage) => {
      const serviceId = usage.service._id.toString();
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          serviceId,
          serviceName: usage.service.name,
          unitPrice: usage.service.price,
          totalQuantity: 0,
          totalRevenue: 0,
          usageCount: 0,
        };
      }
      serviceStats[serviceId].totalQuantity += usage.quantity;
      serviceStats[serviceId].totalRevenue += usage.amount;
      serviceStats[serviceId].usageCount += 1;
    });

    // Convert to array and sort by revenue
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit, 10));

    // Calculate total services revenue
    const totalServicesRevenue = Object.values(serviceStats).reduce(
      (sum, stat) => sum + stat.totalRevenue,
      0
    );

    res.status(200).json(
      successResponse('Top services retrieved successfully', {
        topServices,
        totalServicesRevenue,
        totalServices: Object.keys(serviceStats).length,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

