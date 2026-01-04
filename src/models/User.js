/**
 * @fileoverview User model for authentication and authorization
 * @module models/User
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @typedef {Object} UserSchema
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - Hashed password
 * @property {('admin'|'staff'|'customer')} role - User role
 * @property {boolean} isActive - Whether the user account is active
 * @property {Date} createdAt - Account creation timestamp
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: false, // We're using createdAt manually
    versionKey: false,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
/**
 * Compares provided password with user's hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for frequent queries
userSchema.index({ email: 1 }, { unique: true }); // Unique index on email (already unique, but explicit for performance)
userSchema.index({ role: 1 }); // Query users by role
userSchema.index({ isActive: 1 }); // Query active users
userSchema.index({ role: 1, isActive: 1 }); // Composite index for role + active status queries

const User = mongoose.model('User', userSchema);

export default User;

