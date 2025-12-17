/**
 * @fileoverview Dummy email/SMS service for development
 * Logs OTP/tokens to console instead of sending real emails/SMS
 * @module utils/emailService
 */

/**
 * Sends password reset OTP/token (dummy implementation - logs to console)
 * @param {string} email - Recipient email address
 * @param {string} token - Reset token or OTP
 * @param {string} type - Type of message ('reset' or 'otp')
 */
export const sendPasswordResetToken = (email, token, type = 'reset') => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  console.log('='.repeat(60));
  console.log('📧 DUMMY EMAIL SERVICE - Password Reset');
  console.log('='.repeat(60));
  console.log(`To: ${email}`);
  console.log(`Type: ${type === 'otp' ? 'OTP' : 'Reset Token'}`);
  if (type === 'otp') {
    console.log(`OTP: ${token}`);
  } else {
    console.log(`Reset Token: ${token}`);
    console.log(`Reset URL: ${resetUrl}`);
  }
  console.log('='.repeat(60));
  
  // In production, replace this with actual email service (e.g., SendGrid, AWS SES, etc.)
  // Example:
  // await sendEmail({
  //   to: email,
  //   subject: 'Password Reset Request',
  //   html: `Your reset token is: ${token}`
  // });
};

/**
 * Sends OTP via SMS (dummy implementation - logs to console)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP code
 */
export const sendOTP = (phoneNumber, otp) => {
  console.log('='.repeat(60));
  console.log('📱 DUMMY SMS SERVICE - OTP');
  console.log('='.repeat(60));
  console.log(`To: ${phoneNumber}`);
  console.log(`OTP: ${otp}`);
  console.log('='.repeat(60));
  
  // In production, replace this with actual SMS service (e.g., Twilio, AWS SNS, etc.)
};

