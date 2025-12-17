/**
 * @fileoverview Utility to generate random tokens for password reset
 * @module utils/generateToken
 */

import crypto from 'crypto';

/**
 * Generate random reset token
 * @returns {string} Random hexadecimal token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash reset token using SHA256
 * @param {string} token - Plain text token
 * @returns {string} Hashed token
 */
export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

