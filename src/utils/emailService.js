/**
 * @fileoverview Email/SMS service
 * - Sends real emails via SMTP (Nodemailer)
 * - Can also log tokens/OTP to console in development if desired
 * @module utils/emailService
 */

import nodemailer from "nodemailer";

/**
 * Create Nodemailer transporter from environment variables
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Email config missing. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: { user, pass },
  });
};

/**
 * Sends password reset OTP/token (REAL EMAIL)
 * @param {string} email - Recipient email address
 * @param {string} token - Reset token or OTP
 * @param {string} type - Type of message ('reset' or 'otp')
 */
export const sendPasswordResetToken = async (email, token, type = "reset") => {
  // Optional: keep console log for development visibility
  if (process.env.NODE_ENV !== "production") {
    console.log("=".repeat(60));
    console.log("📧 EMAIL SERVICE");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Type: ${type === "otp" ? "OTP" : "Reset Token"}`);
    console.log(`${type === "otp" ? "OTP" : "Token"}: ${token}`);
    console.log("=".repeat(60));
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  // For reset flow, your frontend page will accept token (paste or query param)
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject =
    type === "otp"
      ? "CheckInn OTP Code (Password Reset)"
      : "CheckInn Password Reset Token";

  const text =
    type === "otp"
      ? `Your OTP code is: ${token}\n\nThis code will expire soon.\nIf you didn't request this, ignore this email.`
      : `Your password reset token is: ${token}\n\nYou can reset your password here:\n${resetUrl}\n\nToken expires in 10 minutes.\nIf you didn't request this, ignore this email.`;

  const html =
    type === "otp"
      ? `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>CheckInn Password Reset OTP</h2>
          <p>Your OTP code is:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${token}</div>
          <p>This OTP will expire soon.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>CheckInn Password Reset</h2>
          <p>Your password reset token is:</p>
          <div style="font-size: 18px; font-weight: bold;">${token}</div>
          <p>You can reset your password using this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p><b>Token expires in 10 minutes.</b></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });

    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err?.message || err);
    throw err;
  }
};

/**
 * Sends OTP via SMS (still dummy unless you add Twilio/AWS SNS)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP code
 */
export const sendOTP = async (phoneNumber, otp) => {
  // Dummy SMS: keep for now
  console.log("=".repeat(60));
  console.log("📱 DUMMY SMS SERVICE - OTP");
  console.log("=".repeat(60));
  console.log(`To: ${phoneNumber}`);
  console.log(`OTP: ${otp}`);
  console.log("=".repeat(60));

  // Production example: integrate Twilio / AWS SNS here
  return true;
};

/**
 * Sends a general email (for notifications, promotions, etc.)
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email body
 * @param {string} html - HTML email body (optional)
 */
export const sendEmail = async (email, subject, text, html = null) => {
  // Optional: keep console log for development visibility
  if (process.env.NODE_ENV !== "production") {
    console.log("=".repeat(60));
    console.log("📧 EMAIL SERVICE");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log("=".repeat(60));
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from,
      to: email,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    await transporter.sendMail(mailOptions);

    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err?.message || err);
    throw err;
  }
};