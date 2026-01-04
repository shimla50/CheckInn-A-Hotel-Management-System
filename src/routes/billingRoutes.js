/**
 * @fileoverview Billing routes
 * @module routes/billingRoutes
 */
import { protect, authorize } from '../middleware/auth.js';


import express from 'express';
import {
  generateInvoiceForBooking,
  recordPayment,
  getPaymentHistory,
  initiateSslcommerzPayment,
  payWithLocalMethod,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  sslcommerzIpn,
  sslcommerzMockPayment,
} from '../controllers/billingController.js';

const router = express.Router();


/**
 * @route POST /api/billing/bookings/:bookingId/payment
 * @desc Record a payment for a booking
 * @access Private (Staff/Admin/Customer - customers can only pay for their own bookings)
 */
router.post(
  '/bookings/:bookingId/payment',
  protect,
  recordPayment
);

/**
 * @route POST /api/billing/bookings/:bookingId/pay/sslcommerz
 * @desc Customer: Create SSLCommerz session and get redirect URL
 * @access Private (Customer - only own bookings)
 */
router.post(
  '/bookings/:bookingId/pay/sslcommerz',
  protect,
  initiateSslcommerzPayment
);

/**
 * @route POST /api/billing/pay/:bookingId
 * @desc Pay with local payment method (bkash, rocket, nagad, bank, cash)
 * @access Private (Staff/Admin/Customer - customers can only pay for their own bookings)
 */
router.post(
  '/pay/:bookingId',
  protect,
  payWithLocalMethod
);


/**
 * @route GET /api/billing/bookings/:bookingId/payments
 * @desc Get payment history for a booking
 * @access Private (Staff/Admin/Customer - customers can only view their own bookings)
 */
router.get(
  '/bookings/:bookingId/payments',
  protect,
  getPaymentHistory
);

/**
 * @route GET /api/billing/bookings/:bookingId/invoice
 * @desc Generate invoice for a booking (customers can view their own)
 * @access Private (Staff/Admin/Customer - customers can only view their own bookings)
 */
router.get(
  '/bookings/:bookingId/invoice',
  protect,
  generateInvoiceForBooking
);

/**
 * SSLCommerz gateway callbacks (public)
 * These endpoints are called by SSLCommerz after payment attempt.
 */
router.get('/sslcommerz/mock-payment', sslcommerzMockPayment);
router.post('/sslcommerz/success', sslcommerzSuccess);
router.get('/sslcommerz/success', sslcommerzSuccess);
router.post('/sslcommerz/fail', sslcommerzFail);
router.get('/sslcommerz/fail', sslcommerzFail);
router.post('/sslcommerz/cancel', sslcommerzCancel);
router.get('/sslcommerz/cancel', sslcommerzCancel);
router.post('/sslcommerz/ipn', sslcommerzIpn);

export default router;