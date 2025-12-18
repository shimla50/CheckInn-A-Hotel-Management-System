/**
 * @fileoverview Billing service for calculating costs and generating invoices
 * @module services/billingService
 */

import ServiceUsage from '../models/ServiceUsage.js';
import Payment from '../models/Payment.js';

/**
 * Calculate total cost for a booking including room and services
 * @param {Object} booking - Booking object with populated room
 * @returns {Promise<Object>} Object with roomCost, servicesCost, and totalCost
 */
export const calculateBookingTotal = async (booking) => {
  // Ensure room is populated
  if (!booking.room || typeof booking.room.pricePerNight === 'undefined') {
    throw new Error('Room must be populated with pricePerNight');
  }

  // Room cost: pricePerNight * totalNights
  const roomCost = booking.room.pricePerNight * booking.totalNights;

  // Get all service usages for this booking
  const serviceUsages = await ServiceUsage.find({ booking: booking._id })
    .populate('service', 'name price');

  // Calculate total services cost
  let servicesCost = 0;
  const serviceItems = serviceUsages.map((usage) => {
    const itemTotal = usage.amount;
    servicesCost += itemTotal;
    return {
      serviceId: usage.service._id,
      serviceName: usage.service.name,
      quantity: usage.quantity,
      unitPrice: usage.service.price,
      total: itemTotal,
    };
  });

  const totalCost = roomCost + servicesCost;

  return {
    roomCost,
    servicesCost,
    totalCost,
    serviceItems,
  };
};

/**
 * Generate invoice number
 * @returns {string} Invoice number in format INV-YYYYMMDD-XXXXX
 */
export const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Get total paid amount for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<number>} Total amount paid
 */
export const getTotalPaid = async (bookingId) => {
  const payments = await Payment.find({
    booking: bookingId,
    status: 'paid',
  });

  return payments.reduce((total, payment) => total + payment.amount, 0);
};

/**
 * Check if booking is fully paid
 * @param {string} bookingId - Booking ID
 * @param {number} totalAmount - Total booking amount
 * @returns {Promise<boolean>} True if fully paid
 */
export const isFullyPaid = async (bookingId, totalAmount) => {
  const totalPaid = await getTotalPaid(bookingId);
  return totalPaid >= totalAmount;
};

