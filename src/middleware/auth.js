/**
 * @fileoverview Authentication and authorization middleware
 * @module middleware/auth
 */

import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/ApiResponse.js';
import User from '../models/User.js';

/**
 * Middleware to protect routes - verifies JWT token
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies or Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(
        errorResponse('Not authorized to access this route', null, 401)
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json(
          errorResponse('User not found', null, 401)
        );
      }

      if (!req.user.isActive) {
        return res.status(401).json(
          errorResponse('User account is inactive', null, 401)
        );
      }

      next();
    } catch (error) {
      return res.status(401).json(
        errorResponse('Not authorized to access this route', null, 401)
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Not authorized to access this route', null, 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          null,
          403
        )
      );
    }

    next();
  };
};

