/**
 * @fileoverview ServiceUsage model for tracking additional services used in bookings
 * @module models/ServiceUsage
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} ServiceUsageSchema
 * @property {mongoose.Types.ObjectId} booking - Reference to Booking
 * @property {mongoose.Types.ObjectId} service - Reference to Service
 * @property {number} quantity - Quantity of service used
 * @property {number} amount - Total amount for this service usage (price * quantity)
 * @property {Date} createdAt - Service usage creation timestamp
 * @property {Date} updatedAt - Service usage last update timestamp
 */

const serviceUsageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're handling timestamps manually
    versionKey: false,
  }
);

// Update updatedAt before saving
serviceUsageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequent queries
serviceUsageSchema.index({ booking: 1 }); // Query service usages by booking
serviceUsageSchema.index({ service: 1 }); // Query service usages by service
serviceUsageSchema.index({ booking: 1, service: 1 }); // Composite index for booking-service queries

const ServiceUsage = mongoose.model('ServiceUsage', serviceUsageSchema);

export default ServiceUsage;

