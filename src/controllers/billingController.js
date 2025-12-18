/**
 * @fileoverview Billing controller for invoice generation and payment recording
 * @module controllers/billingController
 */

import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';
import {
  calculateBookingTotal,
  generateInvoiceNumber,
  getTotalPaid,
  isFullyPaid,
} from '../services/billingService.js';
import { initiatePaymentGateway } from '../utils/paymentGateway.js';

/**
 * Generate invoice for a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const generateInvoiceForBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Calculate totals
    const billingDetails = await calculateBookingTotal(booking);

    // Get payment history
    const payments = await Payment.find({ booking: bookingId })
      .sort({ createdAt: -1 });

    const totalPaid = await getTotalPaid(bookingId);
    const balanceDue = billingDetails.totalCost - totalPaid;
    const isPaid = await isFullyPaid(bookingId, billingDetails.totalCost);

    // Generate invoice number if not exists
    let invoiceNumber = payments.find((p) => p.invoiceNumber)?.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = generateInvoiceNumber();
    }

    // Build invoice object
    const invoice = {
      invoiceNumber,
      bookingId: booking._id,
      issueDate: new Date(),
      guest: {
        name: booking.guest.name,
        email: booking.guest.email,
      },
      room: {
        code: booking.room.code,
        type: booking.room.type,
        pricePerNight: booking.room.pricePerNight,
      },
      stayDetails: {
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalNights: booking.totalNights,
      },
      lineItems: [
        {
          description: `Room ${booking.room.code} - ${booking.totalNights} night(s)`,
          quantity: booking.totalNights,
          unitPrice: booking.room.pricePerNight,
          total: billingDetails.roomCost,
        },
        ...billingDetails.serviceItems.map((item) => ({
          description: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      ],
      totals: {
        subtotal: billingDetails.totalCost,
        tax: 0, // Can be added later if needed
        total: billingDetails.totalCost,
      },
      paymentSummary: {
        totalPaid,
        balanceDue,
        isFullyPaid: isPaid,
      },
      payments: payments.map((payment) => ({
        id: payment._id,
        amount: payment.amount,
        method: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        invoiceNumber: payment.invoiceNumber,
        createdAt: payment.createdAt,
      })),
    };

    res.status(200).json(
      successResponse('Invoice generated successfully', { invoice }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Record a payment for a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const recordPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;

    // Validation
    if (!amount || !paymentMethod) {
      return res.status(400).json(
        errorResponse('Please provide amount and paymentMethod', null, 400)
      );
    }

    if (!['cash', 'card', 'online'].includes(paymentMethod)) {
      return res.status(400).json(
        errorResponse('Invalid payment method. Must be cash, card, or online', null, 400)
      );
    }

    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Calculate total cost
    const billingDetails = await calculateBookingTotal(booking);
    const totalPaid = await getTotalPaid(bookingId);
    const balanceDue = billingDetails.totalCost - totalPaid;

    // Validate payment amount doesn't exceed balance
    if (amount > balanceDue) {
      return res.status(400).json(
        errorResponse(`Payment amount (${amount}) exceeds balance due (${balanceDue})`, null, 400)
      );
    }

    let gatewayResponse = null;
    let paymentStatus = 'pending';
    let finalTransactionId = transactionId;

    // If online payment, initiate payment gateway
    if (paymentMethod === 'online') {
      try {
        gatewayResponse = await initiatePaymentGateway({
          amount,
          paymentMethod,
          bookingId,
          customerInfo: {
            name: booking.guest?.name || 'Guest',
            email: booking.guest?.email || '',
          },
        });

        if (gatewayResponse.success) {
          paymentStatus = 'paid';
          finalTransactionId = gatewayResponse.transactionId;
        } else {
          paymentStatus = 'failed';
        }
      } catch (error) {
        console.error('Payment gateway error:', error);
        paymentStatus = 'failed';
      }
    } else {
      // For cash and card, assume paid immediately
      paymentStatus = 'paid';
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      amount,
      paymentMethod,
      status: paymentStatus,
      transactionId: finalTransactionId,
      invoiceNumber,
    });

    // Check if booking is now fully paid
    const newTotalPaid = await getTotalPaid(bookingId);
    const isFullyPaidNow = newTotalPaid >= billingDetails.totalCost;

    // Note: In a real system, you might want to update booking status or send notifications here

    res.status(201).json(
      successResponse('Payment recorded successfully', {
        payment,
        paymentSummary: {
          totalPaid: newTotalPaid,
          balanceDue: billingDetails.totalCost - newTotalPaid,
          isFullyPaid: isFullyPaidNow,
        },
        gatewayResponse,
      }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history for a booking
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    const payments = await Payment.find({ booking: bookingId })
      .sort({ createdAt: -1 });

    const billingDetails = await calculateBookingTotal(
      await booking.populate('room', 'pricePerNight')
    );
    const totalPaid = await getTotalPaid(bookingId);
    const balanceDue = billingDetails.totalCost - totalPaid;

    res.status(200).json(
      successResponse('Payment history retrieved successfully', {
        payments,
        summary: {
          totalCost: billingDetails.totalCost,
          totalPaid,
          balanceDue,
          isFullyPaid: balanceDue <= 0,
        },
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

