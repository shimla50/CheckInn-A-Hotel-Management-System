/**
 * @fileoverview Settings model for system configuration
 * @module models/Settings
 */

import mongoose from 'mongoose';

/**
 * @typedef {Object} SettingsSchema
 * @property {number} defaultTaxRate - Default tax rate percentage (0-100)
 * @property {string} currencySymbol - Currency symbol (e.g., '$', '€')
 * @property {string} defaultCheckInTime - Default check-in time (HH:mm format)
 * @property {string} defaultCheckOutTime - Default check-out time (HH:mm format)
 * @property {Date} updatedAt - Last update timestamp
 */

const settingsSchema = new mongoose.Schema(
  {
    defaultTaxRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    currencySymbol: {
      type: String,
      default: '$',
      trim: true,
      maxlength: 5,
    },
    defaultCheckInTime: {
      type: String,
      default: '14:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
    },
    defaultCheckOutTime: {
      type: String,
      default: '11:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

