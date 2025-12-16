/**
 * @fileoverview Simple MongoDB backup script
 * @module scripts/backup
 * 
 * This is a minimal stub backup script to satisfy NFR-7.
 * For production use, consider using mongodump or a proper backup solution.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get models
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';
import Booking from '../src/models/Booking.js';
import Service from '../src/models/Service.js';
import ServiceUsage from '../src/models/ServiceUsage.js';
import Payment from '../src/models/Payment.js';
import Feedback from '../src/models/Feedback.js';

const models = {
  User,
  Room,
  Booking,
  Service,
  ServiceUsage,
  Payment,
  Feedback,
};

/**
 * Create backup directory if it doesn't exist
 */
const ensureBackupDir = () => {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

/**
 * Backup a single collection
 * @param {string} collectionName - Name of the collection
 * @param {mongoose.Model} Model - Mongoose model
 * @param {string} backupDir - Backup directory path
 */
const backupCollection = async (collectionName, Model, backupDir) => {
  try {
    console.log(`Backing up ${collectionName}...`);
    const data = await Model.find({}).lean();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${collectionName}_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ ${collectionName}: ${data.length} documents backed up to ${filename}`);
    
    return {
      collection: collectionName,
      count: data.length,
      filename,
    };
  } catch (error) {
    console.error(`✗ Error backing up ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Main backup function
 */
const runBackup = async () => {
  try {
    console.log('Starting backup process...');
    console.log(`Connecting to MongoDB: ${process.env.MONGO_URI}`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Create backup directory
    const backupDir = ensureBackupDir();
    console.log(`✓ Backup directory: ${backupDir}`);

    // Backup all collections
    const results = [];
    for (const [collectionName, Model] of Object.entries(models)) {
      try {
        const result = await backupCollection(collectionName, Model, backupDir);
        results.push(result);
      } catch (error) {
        console.error(`Failed to backup ${collectionName}:`, error);
      }
    }

    // Create summary file
    const timestamp = new Date().toISOString();
    const summary = {
      timestamp,
      backupDir,
      collections: results,
      totalDocuments: results.reduce((sum, r) => sum + r.count, 0),
    };

    const summaryFilename = `backup_summary_${timestamp.replace(/[:.]/g, '-')}.json`;
    const summaryPath = path.join(backupDir, summaryFilename);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log('\n✓ Backup completed successfully!');
    console.log(`Summary: ${results.length} collections, ${summary.totalDocuments} total documents`);
    console.log(`Summary file: ${summaryFilename}`);

    // Close connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Backup failed:', error);
    process.exit(1);
  }
};

// Run backup
runBackup();

export default runBackup;

