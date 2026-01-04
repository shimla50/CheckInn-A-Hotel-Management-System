/**
 * @fileoverview Payment/Invoice model for booking payments
 * @module models/Payment
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} PaymentSchema
 * @property {mongoose.Types.ObjectId} booking - Reference to Booking
 * @property {number} amount - Payment amount
 * @property {('cash'|'card'|'online'|'sslcommerz'|'sslcommerz-demo'|'bkash'|'rocket'|'nagad'|'bank')} paymentMethod - Payment method
 * @property {('pending'|'paid'|'failed')} status - Payment status
 * @property {string} transactionId - Optional transaction ID from payment gateway
 * @property {string} invoiceNumber - Invoice number for this payment
 * @property {Date} createdAt - Payment creation timestamp
 */

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'sslcommerz', 'sslcommerz-demo', 'bkash', 'rocket', 'nagad', 'bank'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    },
    invoiceNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false, // We're handling timestamps manually
    versionKey: false,
  }
);

// Indexes for frequent queries
paymentSchema.index({ booking: 1 }); // Query payments by booking
paymentSchema.index({ status: 1 }); // Query payments by status
paymentSchema.index({ paymentMethod: 1 }); // Query payments by method
paymentSchema.index({ booking: 1, status: 1 }); // Composite index for booking-status queries (optimized for reports)
paymentSchema.index({ transactionId: 1 }, { sparse: true }); // Index for transaction ID lookups
paymentSchema.index({ createdAt: -1 }); // Query recent payments
paymentSchema.index({ invoiceNumber: 1 }, { sparse: true, unique: true }); // Index for invoice lookups

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;