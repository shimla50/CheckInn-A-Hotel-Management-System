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
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight amenities maxGuests')
      .populate('guest', 'name email')
      .populate('createdBy', 'name email role');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Authorization check: customers can only view their own bookings
    if (userRole === 'customer' && booking.guest._id.toString() !== userId) {
      return res.status(403).json(
        errorResponse('You can only view invoices for your own bookings', null, 403)
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!amount || !paymentMethod) {
      return res.status(400).json(
        errorResponse('Please provide amount and paymentMethod', null, 400)
      );
    }

    const validPaymentMethods = ['cash', 'card', 'online', 'sslcommerz', 'sslcommerz-demo', 'bkash', 'rocket', 'nagad', 'bank'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json(
        errorResponse(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`, null, 400)
      );
    }

    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight')
      .populate('guest', 'name email');

    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Authorization check: customers can only pay for their own bookings
    if (userRole === 'customer' && booking.guest._id.toString() !== userId) {
      return res.status(403).json(
        errorResponse('You can only make payments for your own bookings', null, 403)
      );
    }

    // Customers can only use online payment methods (but staff/admin can use all methods)
    // Note: Local payment methods (bkash, rocket, nagad, bank) are typically used by staff at checkout
    if (userRole === 'customer' && !['online', 'sslcommerz'].includes(paymentMethod)) {
      return res.status(400).json(
        errorResponse('Customers can only use online payment methods (online or sslcommerz)', null, 400)
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

    // If online payment or SSL Commerz (not demo), initiate payment gateway
    if (paymentMethod === 'online' || paymentMethod === 'sslcommerz') {
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
          // SSLCommerz (and most gateways) confirm payment via callback/IPN.
          // So we create a pending payment and redirect the customer to the gateway page.
          paymentStatus = paymentMethod === 'sslcommerz' ? 'pending' : 'paid';
          finalTransactionId = gatewayResponse.transactionId;
        } else {
          paymentStatus = 'failed';
        }
      } catch (error) {
        console.error('Payment gateway error:', error);
        paymentStatus = 'failed';
      }
    } else {
      // For cash, card, bkash, rocket, nagad, bank - assume paid immediately
      paymentStatus = 'paid';
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create payment record
    const paymentData = {
      booking: bookingId,
      amount,
      paymentMethod,
      status: paymentStatus,
      transactionId: finalTransactionId,
      invoiceNumber,
    };

    // Set paidAt timestamp if payment is marked as paid
    if (paymentStatus === 'paid') {
      paymentData.paidAt = new Date();
    }

    const payment = await Payment.create(paymentData);

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
 * Initiate SSLCommerz payment for a booking (customer "Pay Now")
 * This creates a pending payment record and returns a redirect URL to SSLCommerz.
 * @route POST /api/billing/bookings/:bookingId/pay/sslcommerz
 * @access Private (Customer - only for own bookings)
 */
export const initiateSslcommerzPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'customer') {
      return res.status(403).json(
        errorResponse('Only customers can initiate SSLCommerz payments from the customer portal', null, 403)
      );
    }

    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight')
      .populate('guest', 'name email');

    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', null, 404));
    }

    // Customers can only pay for their own bookings
    if (booking.guest?._id?.toString() !== userId) {
      return res.status(403).json(errorResponse('You can only pay for your own bookings', null, 403));
    }

    // Calculate balance due
    const billingDetails = await calculateBookingTotal(booking);
    const totalPaid = await getTotalPaid(bookingId);
    const balanceDue = billingDetails.totalCost - totalPaid;

    if (balanceDue <= 0) {
      return res.status(400).json(errorResponse('This booking is already fully paid', null, 400));
    }

    // Initiate SSLCommerz session
    const gatewayResponse = await initiatePaymentGateway({
      amount: balanceDue,
      paymentMethod: 'sslcommerz',
      bookingId,
      customerInfo: {
        name: booking.guest?.name || 'Guest',
        email: booking.guest?.email || '',
      },
    });

    if (!gatewayResponse?.success) {
      return res.status(502).json(
        errorResponse('Failed to initiate SSLCommerz payment session', gatewayResponse || null, 502)
      );
    }

    const invoiceNumber = generateInvoiceNumber();

    // Demo mode: If this is a demo payment, mark it as paid immediately
    if (gatewayResponse.isDemo) {
      const payment = await Payment.create({
        booking: bookingId,
        amount: balanceDue,
        paymentMethod: 'sslcommerz-demo',
        status: 'paid',
        transactionId: gatewayResponse.transactionId,
        invoiceNumber,
        paidAt: new Date(),
      });

      return res.status(200).json(
        successResponse('Payment completed successfully (demo mode)', {
          payment,
          transactionId: gatewayResponse.transactionId,
          balanceDue: 0,
          isDemo: true,
        }, 200)
      );
    }

    // Real SSLCommerz: Create pending payment record (will be updated after gateway callback/IPN)
    if (!gatewayResponse?.redirectUrl) {
      return res.status(502).json(
        errorResponse('Failed to get SSLCommerz redirect URL', gatewayResponse || null, 502)
      );
    }

    const payment = await Payment.create({
      booking: bookingId,
      amount: balanceDue,
      paymentMethod: 'sslcommerz',
      status: 'pending',
      transactionId: gatewayResponse.transactionId,
      invoiceNumber,
    });

    return res.status(200).json(
      successResponse('SSLCommerz session created', {
        payment,
        redirectUrl: gatewayResponse.redirectUrl,
        transactionId: gatewayResponse.transactionId,
        balanceDue,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Pay with local payment method (bkash, rocket, nagad, bank, cash)
 * This is a simple local payment flow that marks the invoice as paid without calling any external gateway
 * @route POST /api/billing/pay/:bookingId
 * @access Private (Staff/Admin/Customer - customers can only pay for their own bookings)
 */
export const payWithLocalMethod = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { method } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate payment method
    const validMethods = ['bkash', 'rocket', 'nagad', 'bank', 'cash'];
    if (!method || !validMethods.includes(method)) {
      return res.status(400).json(
        errorResponse(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`, null, 400)
      );
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('room', 'code type pricePerNight')
      .populate('guest', 'name email');

    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found', null, 404));
    }

    // Authorization check: customers can only pay for their own bookings
    if (userRole === 'customer' && booking.guest?._id?.toString() !== userId) {
      return res.status(403).json(errorResponse('You can only pay for your own bookings', null, 403));
    }

    // Calculate balance due
    const billingDetails = await calculateBookingTotal(booking);
    const totalPaid = await getTotalPaid(bookingId);
    const balanceDue = billingDetails.totalCost - totalPaid;

    if (balanceDue <= 0) {
      return res.status(400).json(errorResponse('This booking is already fully paid', null, 400));
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create payment record marked as paid
    const payment = await Payment.create({
      booking: bookingId,
      amount: balanceDue,
      paymentMethod: method,
      status: 'paid',
      transactionId: `${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      invoiceNumber,
      paidAt: new Date(),
    });

    // Get updated payment summary
    const newTotalPaid = await getTotalPaid(bookingId);
    const newBalanceDue = billingDetails.totalCost - newTotalPaid;

    return res.status(200).json(
      successResponse(`Payment completed successfully with ${method}`, {
        payment,
        invoice: {
          invoiceNumber,
          totalCost: billingDetails.totalCost,
          totalPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          isFullyPaid: newBalanceDue <= 0,
        },
      }, 200)
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId)
      .populate('guest', 'name email');
    if (!booking) {
      return res.status(404).json(
        errorResponse('Booking not found', null, 404)
      );
    }

    // Authorization check: customers can only view their own bookings
    if (userRole === 'customer' && booking.guest._id.toString() !== userId) {
      return res.status(403).json(
        errorResponse('You can only view payment history for your own bookings', null, 403)
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



/**
 * Mock SSLCommerz payment page (development only)
 * This simulates the SSLCommerz payment gateway page for testing
 */
export const sslcommerzMockPayment = async (req, res, next) => {
  try {
    const { tran_id, amount, bookingId } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Generate mock payment page HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SSLCommerz Payment - Development Mode</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .payment-card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #2563eb; margin-top: 0; }
    .amount { font-size: 24px; font-weight: bold; color: #059669; margin: 20px 0; }
    .info { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .buttons { display: flex; gap: 10px; margin-top: 30px; }
    button {
      flex: 1;
      padding: 15px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-success:hover { background: #059669; }
    .btn-fail {
      background: #ef4444;
      color: white;
    }
    .btn-fail:hover { background: #dc2626; }
    .btn-cancel {
      background: #6b7280;
      color: white;
    }
    .btn-cancel:hover { background: #4b5563; }
  </style>
</head>
<body>
  <div class="payment-card">
    <h1>🔒 SSLCommerz Payment Gateway</h1>
    <div class="info">
      <strong>⚠️ Development Mode</strong><br>
      This is a mock payment page for testing. In production, you would see the real SSLCommerz payment form.
    </div>
    <p><strong>Transaction ID:</strong> ${tran_id || 'N/A'}</p>
    <p><strong>Booking ID:</strong> ${bookingId || 'N/A'}</p>
    <div class="amount">Amount: ৳${amount || '0.00'}</div>
    <p>Select an option to simulate payment:</p>
    <div class="buttons">
      <button class="btn-success" onclick="simulatePayment('success')">✅ Simulate Success</button>
      <button class="btn-fail" onclick="simulatePayment('fail')">❌ Simulate Failure</button>
      <button class="btn-cancel" onclick="simulatePayment('cancel')">🚫 Cancel</button>
    </div>
  </div>
  <script>
    function simulatePayment(action) {
      const baseUrl = '${process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`}';
      const tranId = '${tran_id}';
      
      if (action === 'success') {
        window.location.href = baseUrl + '/api/billing/sslcommerz/success?tran_id=' + tranId;
      } else if (action === 'fail') {
        window.location.href = baseUrl + '/api/billing/sslcommerz/fail?tran_id=' + tranId;
      } else {
        window.location.href = baseUrl + '/api/billing/sslcommerz/cancel?tran_id=' + tranId;
      }
    }
  </script>
</body>
</html>
    `;
    
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * SSLCommerz success callback (gateway redirects here)
 * NOTE: For production, you should verify payment with SSLCommerz validation API.
 */
export const sslcommerzSuccess = async (req, res, next) => {
  try {
    const tran_id = req.body?.tran_id || req.query?.tran_id;
    if (tran_id) {
      await Payment.findOneAndUpdate(
        { transactionId: tran_id },
        { status: 'paid' },
        { new: true }
      );
    }
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/customer/bookings?payment=success`);
  } catch (error) {
    next(error);
  }
};

export const sslcommerzFail = async (req, res, next) => {
  try {
    const tran_id = req.body?.tran_id || req.query?.tran_id;
    if (tran_id) {
      await Payment.findOneAndUpdate(
        { transactionId: tran_id },
        { status: 'failed' },
        { new: true }
      );
    }
    // Redirect to frontend with failure message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/customer/bookings?payment=failed`);
  } catch (error) {
    next(error);
  }
};

export const sslcommerzCancel = async (req, res, next) => {
  try {
    const tran_id = req.body?.tran_id || req.query?.tran_id;
    if (tran_id) {
      await Payment.findOneAndUpdate(
        { transactionId: tran_id },
        { status: 'cancelled' },
        { new: true }
      );
    }
    // Redirect to frontend with cancel message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/customer/bookings?payment=cancelled`);
  } catch (error) {
    next(error);
  }
};

// IPN endpoint (optional)
export const sslcommerzIpn = async (req, res) => {
  // For now just acknowledge. You can verify and update payment status here.
  res.status(200).json({ received: true });
};