/**
 * @fileoverview Authentication controller
 * @module controllers/authController
 */

import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtToken.js';
import { generateResetToken, hashResetToken } from '../utils/generateToken.js';
import { sendPasswordResetToken } from '../utils/emailService.js';

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name - User's full name
 * @property {string} email - User's email
 * @property {string} password - User's password
 * @property {string} role - User role (admin|staff|customer)
 */

/**
 * Register a new user
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json(
        errorResponse('Please provide name, email, and password', null, 400)
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json(
        errorResponse('User already exists with this email', null, 400)
      );
    }

    // Validate role if provided
    if (role && !['admin', 'staff', 'customer'].includes(role)) {
      return res.status(400).json(
        errorResponse('Invalid role. Must be admin, staff, or customer', null, 400)
      );
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(201).json(
      successResponse('User registered successfully', {
        user: userData,
        accessToken,
      }, 201)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Please provide email and password', null, 400)
      );
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json(
        errorResponse('Invalid credentials', null, 401)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(
        errorResponse('Account is inactive. Please contact administrator', null, 401)
      );
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json(
        errorResponse('Invalid credentials', null, 401)
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json(
      successResponse('Login successful', {
        user: userData,
        accessToken,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (clears refresh token cookie)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json(
      successResponse('Logged out successfully', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json(
        errorResponse('Refresh token not provided', null, 401)
      );
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json(
          errorResponse('User not found or inactive', null, 401)
        );
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user._id);

      res.status(200).json(
        successResponse('Token refreshed successfully', {
          accessToken: newAccessToken,
        }, 200)
      );
    } catch (error) {
      return res.status(401).json(
        errorResponse('Invalid or expired refresh token', null, 401)
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset (sends reset token via email)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        errorResponse('Please provide email address', null, 400)
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.status(200).json(
        successResponse('If the email exists, a password reset link has been sent', null, 200)
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    // Save hashed token and expiry (10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send reset token via email (dummy service - logs to console)
    sendPasswordResetToken(user.email, resetToken, 'reset');

    res.status(200).json(
      successResponse('If the email exists, a password reset link has been sent', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using reset token
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json(
        errorResponse('Please provide reset token and new password', null, 400)
      );
    }

    // Hash the provided token to compare with stored token
    const hashedToken = hashResetToken(token);

    // Find user with matching token and check expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json(
        errorResponse('Invalid or expired reset token', null, 400)
      );
    }

    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json(
      successResponse('Password reset successful', null, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(200).json(
      successResponse('User retrieved successfully', { user: userData }, 200)
    );
  } catch (error) {
    next(error);
  }
};

