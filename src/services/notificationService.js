/**
 * @fileoverview Notification service for sending notifications (stub implementation)
 * @module services/notificationService
 */

import Notification from '../models/Notification.js';

/**
 * Send booking confirmation notification
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendBookingConfirmation = async (user, booking) => {
  try {
    const title = 'Booking Confirmation';
    const message = `Your booking for Room ${booking.room?.code || 'N/A'} from ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()} has been confirmed. Booking ID: ${booking._id.toString().slice(-8)}`;

    // Create notification record
    const notification = await Notification.create({
      user: user._id || user.id,
      type: 'booking_confirmation',
      title,
      message,
      metadata: {
        bookingId: booking._id,
        roomCode: booking.room?.code,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
      },
    });

    // Stub: Log to console (in production, send email/SMS)
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - Booking Confirmation');
    console.log('='.repeat(60));
    console.log(`To: ${user.email}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(60));

    return notification;
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    throw error;
  }
};

/**
 * Send check-in reminder notification
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendCheckInReminder = async (user, booking) => {
  try {
    const checkInDate = new Date(booking.checkInDate);
    const title = 'Check-in Reminder';
    const message = `Reminder: Your check-in is scheduled for ${checkInDate.toLocaleDateString()} at Room ${booking.room?.code || 'N/A'}. We look forward to welcoming you!`;

    // Create notification record
    const notification = await Notification.create({
      user: user._id || user.id,
      type: 'checkin_reminder',
      title,
      message,
      metadata: {
        bookingId: booking._id,
        roomCode: booking.room?.code,
        checkInDate: booking.checkInDate,
      },
    });

    // Stub: Log to console (in production, send email/SMS)
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - Check-in Reminder');
    console.log('='.repeat(60));
    console.log(`To: ${user.email}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(60));

    return notification;
  } catch (error) {
    console.error('Error sending check-in reminder:', error);
    throw error;
  }
};

/**
 * Send promotion notification
 * @param {Object} user - User object
 * @param {Object} payload - Promotion payload
 * @param {string} payload.title - Promotion title
 * @param {string} payload.message - Promotion message
 * @param {Object} payload.details - Additional promotion details
 * @returns {Promise<Object>} Created notification
 */
export const sendPromotion = async (user, payload) => {
  try {
    const { title, message, details } = payload;

    // Create notification record
    const notification = await Notification.create({
      user: user._id || user.id,
      type: 'promotion',
      title: title || 'Special Promotion',
      message: message || 'Check out our latest offers!',
      metadata: {
        details: details || {},
      },
    });

    // Stub: Log to console (in production, send email/SMS)
    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - Promotion');
    console.log('='.repeat(60));
    console.log(`To: ${user.email}`);
    console.log(`Title: ${title || 'Special Promotion'}`);
    console.log(`Message: ${message || 'Check out our latest offers!'}`);
    if (details) {
      console.log(`Details:`, details);
    }
    console.log('='.repeat(60));

    return notification;
  } catch (error) {
    console.error('Error sending promotion:', error);
    throw error;
  }
};

/**
 * Send booking approved notification
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendBookingApproved = async (user, booking) => {
  try {
    const title = 'Booking Approved';
    const message = `Great news! Your booking for Room ${booking.room?.code || 'N/A'} has been approved. Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}`;

    const notification = await Notification.create({
      user: user._id || user.id,
      type: 'booking_approved',
      title,
      message,
      metadata: {
        bookingId: booking._id,
        roomCode: booking.room?.code,
      },
    });

    console.log('='.repeat(60));
    console.log('📧 NOTIFICATION - Booking Approved');
    console.log('='.repeat(60));
    console.log(`To: ${user.email}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(60));

    return notification;
  } catch (error) {
    console.error('Error sending booking approved notification:', error);
    throw error;
  }
};

