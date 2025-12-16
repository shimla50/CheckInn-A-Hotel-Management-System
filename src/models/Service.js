/**
 * @fileoverview Service model for additional hotel services
 * @module models/Service
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} ServiceSchema
 * @property {string} name - Service name
 * @property {string} description - Service description
 * @property {number} price - Service price
 * @property {boolean} isActive - Whether the service is currently active/available
 * @property {Date} createdAt - Service creation timestamp
 * @property {Date} updatedAt - Service last update timestamp
 */

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're handling timestamps manually
    versionKey: false,
  }
);

// Update updatedAt before saving
serviceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for frequent queries
serviceSchema.index({ isActive: 1 }); // Query active services
serviceSchema.index({ name: 1 }); // Query by name

const Service = mongoose.model('Service', serviceSchema);

export default Service;

