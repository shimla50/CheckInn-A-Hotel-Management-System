/**
 * @fileoverview Seed script for populating services with default catalog
 * @module scripts/seedServices
 * 
 * Run with: npm run seed:services
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/Service.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/checkinn';

/**
 * Service catalog data
 */
const serviceCatalog = [
  {
    name: 'Laundry',
    description: 'Professional laundry service for your clothes. Same-day service available.',
    price: 500,
    isActive: true,
  },
  {
    name: 'Meal (Lunch Set)',
    description: 'Delicious lunch set menu including appetizer, main course, and dessert.',
    price: 800,
    isActive: true,
  },
  {
    name: 'Meal (Dinner Set)',
    description: 'Premium dinner set menu with multiple courses and beverage options.',
    price: 1200,
    isActive: true,
  },
  {
    name: 'Hair Styling / Salon',
    description: 'Professional hair styling and salon services. Includes haircut, styling, and treatment.',
    price: 1500,
    isActive: true,
  },
  {
    name: 'Theater Booking',
    description: 'Assistance with booking theater tickets and entertainment shows in the city.',
    price: 300,
    isActive: true,
  },
  {
    name: 'Spa Massage',
    description: 'Relaxing spa massage service. Various massage types available.',
    price: 2000,
    isActive: true,
  },
  {
    name: 'Airport Transfer',
    description: 'Comfortable airport transfer service. Available for pickup and drop-off.',
    price: 1500,
    isActive: true,
  },
  {
    name: 'Room Service (Additional)',
    description: 'Additional room service orders beyond standard service.',
    price: 400,
    isActive: true,
  },
];

/**
 * Seed services into database
 */
async function seedServices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing services (optional - comment out if you want to keep existing)
    const existingCount = await Service.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing services.`);
      console.log('Updating/inserting services (existing services will be updated if name matches)...');
    }

    // Insert or update services
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const serviceData of serviceCatalog) {
      try {
        const existingService = await Service.findOne({ name: serviceData.name });
        
        if (existingService) {
          // Update existing service
          existingService.description = serviceData.description;
          existingService.price = serviceData.price;
          existingService.isActive = serviceData.isActive;
          await existingService.save();
          updated++;
          console.log(`Updated service: ${serviceData.name}`);
        } else {
          // Insert new service
          await Service.create(serviceData);
          inserted++;
          console.log(`Inserted service: ${serviceData.name}`);
        }
      } catch (error) {
        console.error(`Error processing service ${serviceData.name}:`, error.message);
        skipped++;
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Inserted: ${inserted} services`);
    console.log(`Updated: ${updated} services`);
    console.log(`Skipped: ${skipped} services`);
    console.log(`Total in catalog: ${serviceCatalog.length} services`);
    console.log('\n✅ Service seeding completed!');

    // Show summary
    const activeCount = await Service.countDocuments({ isActive: true });
    const inactiveCount = await Service.countDocuments({ isActive: false });
    
    console.log('\n=== Service Count ===');
    console.log(`Active: ${activeCount}`);
    console.log(`Inactive: ${inactiveCount}`);

  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run seed function
seedServices();

