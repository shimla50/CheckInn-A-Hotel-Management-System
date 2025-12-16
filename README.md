# CheckInn Hotel Management System - Backend

A MERN stack hotel management system with strict MVC architecture on the backend.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
src/
├── config/          # Configuration files (DB, etc.)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, error handling)
├── models/          # Mongoose models
├── routes/          # Route definitions
├── utils/           # Helper functions
├── app.js           # Express app configuration
└── server.js        # Server startup
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017/checkinn
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

4. Start the production server:
```bash
npm start
```

## API Endpoints

### Public Routes
- `GET /` - API welcome message
- `GET /api/health` - Health check endpoint

### Authentication Routes
- `POST /api/auth/register` - Register a new user (admin, staff, or customer)
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password using token

### Protected Routes
- `GET /api/users/me` - Get current authenticated user

### Role-Based Dashboard Routes
- `GET /api/admin/dashboard` - Admin dashboard (Admin only)
- `GET /api/staff/dashboard` - Staff dashboard (Staff only)
- `GET /api/customer/dashboard` - Customer dashboard (Customer only)

## Architecture

The backend follows strict MVC (Model-View-Controller) architecture:

- **Models**: Mongoose schemas and models
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, authorization, error handling
- **Services**: Reusable business logic (when needed)

