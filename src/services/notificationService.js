/**
 * @fileoverview Notification service for sending email notifications
 * @module services/notificationService
 */

import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/emailService.js';

/**
 * Send booking confirmation notification via email
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendBookingConfirmation = async (user, booking) => {
  try {
    const title = 'Booking Confirmation';
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bookingId = booking._id.toString().slice(-8);
    const roomCode = booking.room?.code || 'N/A';
    const roomType = booking.room?.type || 'N/A';
    const totalAmount = booking.totalAmount || 0;
    const totalNights = booking.totalNights || 0;

    const message = `Your booking for Room ${roomCode} from ${checkInDate} to ${checkOutDate} has been confirmed. Booking ID: ${bookingId}`;

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

    // Send email
    const emailSubject = `CheckInn - Booking Confirmation #${bookingId}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">CheckInn Hotel</h1>
          <p style="margin: 10px 0 0 0;">Booking Confirmation</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Your Booking is Confirmed!</h2>
          <p>Dear ${user.name || 'Guest'},</p>
          <p>We are pleased to confirm your booking at CheckInn Hotel. Below are your booking details:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="margin: 5px 0;"><strong>Room:</strong> ${roomCode} (${roomType})</p>
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
            <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${checkOutDate}</p>
            <p style="margin: 5px 0;"><strong>Total Nights:</strong> ${totalNights}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ৳${totalAmount.toLocaleString()}</p>
          </div>

          <p>We look forward to welcoming you to CheckInn Hotel!</p>
          <p>If you have any questions or need to modify your booking, please contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Best regards,<br>The CheckInn Team</p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, emailSubject, message, emailHtml);
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    throw error;
  }
};

/**
 * Send check-in reminder notification via email
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendCheckInReminder = async (user, booking) => {
  try {
    const checkInDate = new Date(booking.checkInDate);
    const formattedDate = checkInDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const title = 'Check-in Reminder';
    const message = `Reminder: Your check-in is scheduled for ${formattedDate} at Room ${booking.room?.code || 'N/A'}. We look forward to welcoming you!`;
    const roomCode = booking.room?.code || 'N/A';
    const roomType = booking.room?.type || 'N/A';
    const bookingId = booking._id.toString().slice(-8);

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

    // Send email
    const emailSubject = `CheckInn - Check-in Reminder for ${formattedDate}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">CheckInn Hotel</h1>
          <p style="margin: 10px 0 0 0;">Check-in Reminder</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Your Check-in is Tomorrow!</h2>
          <p>Dear ${user.name || 'Guest'},</p>
          <p>This is a friendly reminder that your check-in is scheduled for <strong>${formattedDate}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="margin: 5px 0;"><strong>Room:</strong> ${roomCode} (${roomType})</p>
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${formattedDate}</p>
          </div>

          <p>We are excited to welcome you to CheckInn Hotel! If you have any special requests or need assistance, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Best regards,<br>The CheckInn Team</p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, emailSubject, message, emailHtml);
    } catch (emailError) {
      console.error('Failed to send check-in reminder email:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  } catch (error) {
    console.error('Error sending check-in reminder:', error);
    throw error;
  }
};

/**
 * Send promotion notification via email
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
    const promotionTitle = title || 'Special Promotion';
    const promotionMessage = message || 'Check out our latest offers!';

    // Create notification record
    const notification = await Notification.create({
      user: user._id || user.id,
      type: 'promotion',
      title: promotionTitle,
      message: promotionMessage,
      metadata: {
        details: details || {},
      },
    });

    // Send email
    const emailSubject = `CheckInn - ${promotionTitle}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">CheckInn Hotel</h1>
          <p style="margin: 10px 0 0 0;">${promotionTitle}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">${promotionTitle}</h2>
          <p>Dear ${user.name || 'Valued Guest'},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 16px; color: #333;">${promotionMessage}</p>
          </div>
          ${details && Object.keys(details).length > 0 ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${Object.entries(details).map(([key, value]) => `
                <p style="margin: 5px 0;"><strong>${key}:</strong> ${value}</p>
              `).join('')}
            </div>
          ` : ''}
          <p>Don't miss out on this special offer! Book now and enjoy a wonderful stay at CheckInn Hotel.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Best regards,<br>The CheckInn Team</p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, emailSubject, promotionMessage, emailHtml);
    } catch (emailError) {
      console.error('Failed to send promotion email:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  } catch (error) {
    console.error('Error sending promotion:', error);
    throw error;
  }
};

/**
 * Send booking approved notification via email
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Created notification
 */
export const sendBookingApproved = async (user, booking) => {
  try {
    const title = 'Booking Approved';
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const roomCode = booking.room?.code || 'N/A';
    const bookingId = booking._id.toString().slice(-8);
    const message = `Great news! Your booking for Room ${roomCode} has been approved. Check-in: ${checkInDate}`;

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

    // Send email (same as booking confirmation)
    const emailSubject = `CheckInn - Booking Approved #${bookingId}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">CheckInn Hotel</h1>
          <p style="margin: 10px 0 0 0;">Booking Approved</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Great News! Your Booking is Approved!</h2>
          <p>Dear ${user.name || 'Guest'},</p>
          <p>We are pleased to inform you that your booking has been approved!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="margin: 5px 0;"><strong>Room:</strong> ${roomCode}</p>
            <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
          </div>

          <p>We look forward to welcoming you to CheckInn Hotel!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Best regards,<br>The CheckInn Team</p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, emailSubject, message, emailHtml);
    } catch (emailError) {
      console.error('Failed to send booking approved email:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  } catch (error) {
    console.error('Error sending booking approved notification:', error);
    throw error;
  }
};

