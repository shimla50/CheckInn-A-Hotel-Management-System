/**
 * @fileoverview Notification model for storing notifications
 * @module models/Notification
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} NotificationSchema
 * @property {mongoose.Types.ObjectId} user - Reference to User
 * @property {string} type - Notification type (booking_confirmation, checkin_reminder, promotion, etc.)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Object} metadata - Additional data (booking, payload, etc.)
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} createdAt - Notification creation timestamp
 */

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'booking_confirmation',
        'checkin_reminder',
        'promotion',
        'booking_approved',
        'booking_cancelled',
        'payment_received',
        'other',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Indexes for frequent queries
notificationSchema.index({ user: 1 }); // Query notifications by user
notificationSchema.index({ type: 1 }); // Query notifications by type
notificationSchema.index({ user: 1, isRead: 1 }); // Query unread notifications
notificationSchema.index({ createdAt: -1 }); // Query recent notifications

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

