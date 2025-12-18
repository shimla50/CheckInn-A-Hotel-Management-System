/**
 * @fileoverview Central error handling middleware
 * @module middleware/errorHandler
 */

import { errorResponse } from '../utils/ApiResponse.js';

/**
 * Central error handling middleware
 * Handles all errors thrown in the application
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = errorResponse(message, null, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = errorResponse(message, null, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = errorResponse(message, null, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = errorResponse(message, null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = errorResponse(message, null, 401);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const data = error.data || null;

  res.status(statusCode).json({
    success: false,
    message,
    data,
    statusCode,
  });
};

export default errorHandler;

