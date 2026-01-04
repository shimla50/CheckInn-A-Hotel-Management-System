/**
 * @fileoverview Seed script for populating rooms with default catalog
 * @module scripts/seedRooms
 * 
 * Run with: npm run seed:rooms
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../src/models/Room.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/checkinn';

/**
 * Default free amenities included with all rooms
 */
const DEFAULT_FREE_AMENITIES = [
  'Breakfast',
  'WiFi',
  'Air Conditioning',
  'TV',
  'Room Service',
];

/**
 * Room catalog data
 */
const roomCatalog = [
  // Single rooms
  {
    code: 'S101',
    type: 'single',
    pricePerNight: 2500,
    amenities: [...DEFAULT_FREE_AMENITIES],
    status: 'available',
    maxGuests: 1,
  },
  {
    code: 'S102',
    type: 'single',
    pricePerNight: 2500,
    amenities: [...DEFAULT_FREE_AMENITIES],
    status: 'available',
    maxGuests: 1,
  },
  {
    code: 'S103',
    type: 'single',
    pricePerNight: 2500,
    amenities: [...DEFAULT_FREE_AMENITIES],
    status: 'available',
    maxGuests: 1,
  },
  {
    code: 'S201',
    type: 'single',
    pricePerNight: 2500,
    amenities: [...DEFAULT_FREE_AMENITIES],
    status: 'available',
    maxGuests: 1,
  },
  {
    code: 'S202',
    type: 'single',
    pricePerNight: 2500,
    amenities: [...DEFAULT_FREE_AMENITIES],
    status: 'available',
    maxGuests: 1,
  },

  // Double rooms
  {
    code: 'D101',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },
  {
    code: 'D102',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },
  {
    code: 'D103',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },
  {
    code: 'D201',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },
  {
    code: 'D202',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },
  {
    code: 'D203',
    type: 'double',
    pricePerNight: 3500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar'],
    status: 'available',
    maxGuests: 2,
  },

  // Suites
  {
    code: 'SU101',
    type: 'suite',
    pricePerNight: 5500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar', 'Jacuzzi', 'Balcony', 'Living Area'],
    status: 'available',
    maxGuests: 4,
  },
  {
    code: 'SU102',
    type: 'suite',
    pricePerNight: 5500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar', 'Jacuzzi', 'Balcony', 'Living Area'],
    status: 'available',
    maxGuests: 4,
  },
  {
    code: 'SU201',
    type: 'suite',
    pricePerNight: 5500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar', 'Jacuzzi', 'Balcony', 'Living Area'],
    status: 'available',
    maxGuests: 4,
  },
  {
    code: 'SU202',
    type: 'suite',
    pricePerNight: 5500,
    amenities: [...DEFAULT_FREE_AMENITIES, 'Mini Bar', 'Jacuzzi', 'Balcony', 'Living Area'],
    status: 'available',
    maxGuests: 4,
  },
];

/**
 * Seed rooms into database
 */
async function seedRooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing rooms (optional - comment out if you want to keep existing)
    const existingCount = await Room.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing rooms.`);
      console.log('Updating/inserting rooms (existing rooms will be updated if code matches)...');
    }

    // Insert or update rooms
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const roomData of roomCatalog) {
      try {
        const existingRoom = await Room.findOne({ code: roomData.code });
        
        if (existingRoom) {
          // Update existing room
          existingRoom.type = roomData.type;
          existingRoom.pricePerNight = roomData.pricePerNight;
          existingRoom.amenities = roomData.amenities;
          existingRoom.maxGuests = roomData.maxGuests;
          if (existingRoom.status === 'available' || existingRoom.status === 'maintenance') {
            existingRoom.status = roomData.status;
          }
          await existingRoom.save();
          updated++;
          console.log(`Updated room: ${roomData.code}`);
        } else {
          // Insert new room
          await Room.create(roomData);
          inserted++;
          console.log(`Inserted room: ${roomData.code}`);
        }
      } catch (error) {
        console.error(`Error processing room ${roomData.code}:`, error.message);
        skipped++;
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Inserted: ${inserted} rooms`);
    console.log(`Updated: ${updated} rooms`);
    console.log(`Skipped: ${skipped} rooms`);
    console.log(`Total in catalog: ${roomCatalog.length} rooms`);
    console.log('\n✅ Room seeding completed!');

    // Show summary by type
    const singleCount = await Room.countDocuments({ type: 'single' });
    const doubleCount = await Room.countDocuments({ type: 'double' });
    const suiteCount = await Room.countDocuments({ type: 'suite' });
    
    console.log('\n=== Room Count by Type ===');
    console.log(`Single: ${singleCount}`);
    console.log(`Double: ${doubleCount}`);
    console.log(`Suite: ${suiteCount}`);

  } catch (error) {
    console.error('Error seeding rooms:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run seed function
seedRooms();

