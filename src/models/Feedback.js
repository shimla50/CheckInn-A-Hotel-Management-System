/**
 * @fileoverview Feedback model for customer reviews and ratings
 * @module models/Feedback
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} FeedbackSchema
 * @property {mongoose.Types.ObjectId} customer - Reference to User (customer)
 * @property {mongoose.Types.ObjectId} booking - Optional reference to Booking
 * @property {number} rating - Rating from 1 to 5
 * @property {string} comment - Feedback comment
 * @property {string} responseFromStaff - Optional response from staff/admin
 * @property {Date} createdAt - Feedback creation timestamp
 * @property {Date} updatedAt - Feedback last update timestamp
 */

const feedbackSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      sparse: true, // Allows null values but enforces uniqueness for non-null values
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    responseFromStaff: {
      type: String,
      trim: true,
      maxlength: [1000, 'Staff response cannot exceed 1000 characters'],
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
feedbackSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequent queries
feedbackSchema.index({ customer: 1 }); // Query feedback by customer
feedbackSchema.index({ booking: 1 }, { sparse: true }); // Query feedback by booking
feedbackSchema.index({ rating: 1 }); // Query feedback by rating
feedbackSchema.index({ customer: 1, booking: 1 }, { sparse: true }); // Composite index for customer-booking queries
feedbackSchema.index({ createdAt: -1 }); // Query recent feedback

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

