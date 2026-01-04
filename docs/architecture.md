# CheckInn Hotel Management System - Architecture Documentation

## Overview

CheckInn is a full-stack MERN (MongoDB, Express, React, Node.js) hotel management system designed to handle hotel operations including room management, bookings, billing, and customer feedback.

## System Architecture

### Technology Stack

**Backend:**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer

**Frontend:**
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Architecture Pattern

The system follows **MVC (Model-View-Controller)** architecture:

- **Models** (`src/models/`): Mongoose schemas defining data structure
- **Controllers** (`src/controllers/`): Business logic and request handling
- **Routes** (`src/routes/`): API endpoint definitions
- **Middleware** (`src/middleware/`): Authentication, authorization, validation, error handling
- **Services** (`src/services/`): Reusable business logic (billing, notifications)
- **Utils** (`src/utils/`): Helper functions (email, payment gateway, etc.)

## Scalability & Performance (NFR-6, NFR-10)

### Horizontal Scaling

The application is designed to be **stateless** and can scale horizontally:

1. **Stateless Backend**: 
   - No session state stored in memory
   - JWT tokens stored client-side (localStorage) and in HTTP-only cookies
   - All state stored in MongoDB

2. **Database Configuration**:
   - MongoDB connection string via `MONGO_URI` environment variable
   - Can connect to MongoDB replica sets or sharded clusters
   - All database operations use connection pooling

3. **Load Balancing**:
   - Multiple Node.js instances can run behind a load balancer (Nginx, AWS ALB, etc.)
   - Each instance is independent and stateless
   - Session affinity not required

4. **Caching Strategy** (Future Enhancement):
   - Can add Redis for session caching if needed
   - Can cache frequently accessed data (room availability, etc.)

### Performance Optimizations (NFR-1, NFR-2)

1. **Database Indexes**:
   - All frequently queried fields are indexed
   - Composite indexes for common query patterns
   - See model files for complete index definitions

2. **Pagination**:
   - All list endpoints support pagination (`page`, `limit` query params)
   - Default limit: 10-20 items per page
   - Prevents loading large datasets at once

3. **Query Optimization**:
   - Use `.select()` to limit returned fields
   - Use `.lean()` for read-only queries when possible
   - Avoid unnecessary `.populate()` calls
   - Use aggregation pipelines for complex reports

4. **Frontend Optimization**:
   - React components use proper memoization
   - API calls are debounced where appropriate
   - Images are optimized and served statically

## Security (NFR-4, NFR-5)

### Authentication & Authorization

1. **Password Security**:
   - Passwords hashed using bcryptjs with salt rounds of 10
   - Passwords never stored in plain text
   - Password field excluded from queries by default (`select: false`)

2. **JWT Tokens**:
   - Access tokens: Short-lived (15 minutes default)
   - Refresh tokens: Long-lived (7 days default), stored in HTTP-only cookies
   - Token validation on every protected route

3. **Role-Based Access Control (RBAC)**:
   - Three roles: `admin`, `staff`, `customer`
   - All routes protected with `protect` middleware
   - Role-specific routes protected with `authorize` middleware
   - Middleware checks user role before allowing access

4. **Route Protection**:
   - All API routes except `/api/auth/*` and `/api/health` require authentication
   - Admin routes: `authorize('admin')`
   - Staff routes: `authorize('staff', 'admin')`
   - Customer routes: `authorize('customer')`

### Data Encryption

1. **Sensitive Data**:
   - Passwords: Hashed with bcrypt
   - Payment transaction IDs: Stored as-is (gateway handles encryption)
   - No credit card data stored (payment gateway handles PCI compliance)

2. **HTTPS** (NFR-3):
   - Application ready for HTTPS deployment
   - All URLs configurable via environment variables
   - No hardcoded HTTP URLs in production code

## Reliability & Uptime (NFR-6)

### High Availability

1. **Stateless Design**: Enables horizontal scaling without session issues
2. **Database Replication**: MongoDB replica sets for redundancy
3. **Error Handling**: Comprehensive error middleware catches and logs errors
4. **Health Checks**: `/api/health` endpoint for monitoring

### Backup Strategy (NFR-7)

1. **Automated Backups**:
   - Script: `scripts/backup.js`
   - Command: `npm run backup`
   - Backs up all collections to JSON files in `backups/` directory
   - Can be scheduled via cron job for daily backups

2. **Backup Contents**:
   - Users, Rooms, Bookings, Payments, Services, ServiceUsage, Feedback
   - Timestamped files for versioning
   - Summary file with metadata

## Deployment

### Environment Variables

**Backend (.env):**
```env
MONGO_URI=mongodb://localhost:27017/checkinn
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### HTTPS Setup

1. **Production Deployment**:
   - Use reverse proxy (Nginx, Apache) with SSL certificates
   - Or use cloud provider SSL (AWS, Heroku, etc.)
   - Ensure `CORS_ORIGIN` and `FRONTEND_URL` use HTTPS

2. **Local Development**:
   - Can use HTTP for local development
   - Production must use HTTPS

### Deployment Steps

1. **Backend**:
   ```bash
   npm install
   npm run build  # If using TypeScript
   npm start
   ```

2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run build
   # Serve dist/ folder via Nginx or static hosting
   ```

3. **Database**:
   - Ensure MongoDB is running and accessible
   - Run seed scripts: `npm run seed:rooms`, `npm run seed:services`

## Monitoring & Maintenance

1. **Logging**: Console logs for development, structured logging for production
2. **Error Tracking**: Error middleware logs all errors
3. **Performance Monitoring**: Monitor API response times, database query times
4. **Backup Monitoring**: Verify daily backups complete successfully

## Future Enhancements

1. **Caching Layer**: Add Redis for session and data caching
2. **API Rate Limiting**: Implement rate limiting middleware
3. **Database Sharding**: For very large datasets
4. **CDN**: For static assets and images
5. **Microservices**: Split into smaller services if needed

