/**
 * @fileoverview Express application configuration
 * @module app
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/validation.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// Rate limiting (apply to all routes except health check)
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }));

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CheckInn Hotel Management System API',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

