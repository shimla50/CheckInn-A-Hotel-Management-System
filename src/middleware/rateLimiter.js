/**
 * @fileoverview Simple rate limiting middleware
 * @module middleware/rateLimiter
 */

import { errorResponse } from '../utils/ApiResponse.js';

// In-memory store for rate limiting (use Redis in production)
const requestStore = new Map();

/**
 * Simple rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @returns {Function} Express middleware function
 */
export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.maxRequests || 100; // 100 requests default

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up old entries
    if (requestStore.size > 10000) {
      // Prevent memory leak - clear old entries
      for (const [key, value] of requestStore.entries()) {
        if (now - value.windowStart > windowMs) {
          requestStore.delete(key);
        }
      }
    }

    const record = requestStore.get(identifier);

    if (!record || now - record.windowStart > windowMs) {
      // New window
      requestStore.set(identifier, {
        count: 1,
        windowStart: now,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json(
        errorResponse(
          `Too many requests. Please try again after ${Math.ceil((windowMs - (now - record.windowStart)) / 1000)} seconds`,
          null,
          429
        )
      );
    }

    record.count++;
    next();
  };
};

