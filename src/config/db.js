/**
 * @fileoverview MongoDB database connection configuration
 * @module config/db
 */

import mongoose from 'mongoose';

/**
 * Connects to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB connection options
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const demoRooms = [
  {
    code: '101',
    type: 'single',
    pricePerNight: 60,
    amenities: ['WiFi', 'TV'],
    maxGuests: 1,
    status: 'available'
  },
  {
    code: '102',
    type: 'double',
    pricePerNight: 80,
    amenities: ['WiFi', 'TV'],
    maxGuests: 2,
    status: 'available'
  },
  {
    code: '103',
    type: 'double',
    pricePerNight: 90,
    amenities: ['WiFi', 'TV'],
    maxGuests: 2,
    status: 'available'
  },
  {
    code: '201',
    type: 'double',
    pricePerNight: 120,
    amenities: ['WiFi', 'TV', 'Mini Bar'],
    maxGuests: 2,
    status: 'available'
  },
  {
    code: '202',
    type: 'double',
    pricePerNight: 150,
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Balcony'],
    maxGuests: 4,
    status: 'available'
  },
  {
    code: '301',
    type: 'suite',
    pricePerNight: 200,
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Balcony'],
    maxGuests: 4,
    status: 'available'
  },
  {
    code: '302',
    type: 'suite',
    pricePerNight: 250,
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Workspace'],
    maxGuests: 2,
    status: 'available'
  },
  {
    code: '401',
    type: 'suite',
    pricePerNight: 500,
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Jacuzzi', 'Balcony'],
    maxGuests: 6,
    status: 'available'
  }
];

const seedDemoRooms = async () => {
  try {
    // Import Room model here (adjust path as needed)
    const { default: Room } = await import('../models/Room.js');
    const count = await Room.countDocuments();
    if (count === 0) {
      await Room.insertMany(demoRooms);
      console.log('Demo rooms seeded successfully.');
    } else {
      console.log(`Database already has ${count} rooms. Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding demo rooms:', error.message);
  }
};

export default connectDB;
export { seedDemoRooms };

