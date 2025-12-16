/**
 * @fileoverview Server startup file
 * @module server
 */

import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

