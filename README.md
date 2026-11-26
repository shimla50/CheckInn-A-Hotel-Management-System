# CheckInn — Hotel Management System

A full-stack **MERN** hotel management system (MongoDB, Express, React, Node.js) with role-based access for **admins**, **staff** and **customers**. The backend follows a strict MVC architecture with a REST API; the frontend is a React + Vite single-page app.

Built for **CSE470 (Software Engineering)** coursework at BRAC University, covering 21 functional and 10 non-functional requirements (see [docs/implementation-summary.md](docs/implementation-summary.md)).

![Node.js](https://img.shields.io/badge/Node.js-Express-339933)
![React](https://img.shields.io/badge/React%2018-Vite-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-orange)

## Features

### Customers
- Register, log in, reset a forgotten password
- Search available rooms (Single, Double, Suite) and book them
- Modify or cancel their own bookings
- View invoices and payment history
- Give feedback and see staff replies
- Email notifications: booking confirmation and check-in reminders

### Staff
- Front-desk overview of today's arrivals and departures
- Approve, modify and cancel bookings; check guests in and out
- Record extra service usage (laundry, meals and more) and handle billing with cash, card or online payment (bKash, Nagad, Rocket, bank); the invoice is generated at checkout

### Admins
- Manage rooms, services, users and staff accounts
- Reports: revenue (daily, weekly, monthly), occupancy, top services, revenue by payment method
- Manage feedback, payments and system settings
- Send reminder and promotion emails

### Under the hood
- JWT access and refresh tokens, bcrypt password hashing, role-based route protection
- Rate limiting, input validation and central error handling middleware
- Database indexes and pagination on list endpoints
- Seed scripts for rooms and services, and a JSON backup script
- Payment gateway integration point for SSLCommerz with a sandbox/demo mode

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client

## Project Structure

```
CheckInn-A-Hotel-Management-System/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React Context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Helper utilities
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── scripts/             # Utility scripts
│   └── backup.js
├── src/                 # Node.js backend
│   ├── config/          # Configuration files (DB, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware (auth, error handling)
│   ├── models/          # Mongoose models
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic services
│   ├── utils/           # Helper functions
│   ├── app.js           # Express app configuration
│   └── server.js        # Server startup
├── package.json
└── README.md
```

## Setup

### Backend Setup

1. Install backend dependencies:
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

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Note for Production**: 
- Use HTTPS URLs for `CORS_ORIGIN` and `FRONTEND_URL` in production
- Deploy behind a reverse proxy (Nginx, Apache) with SSL certificates
- Or use cloud provider SSL (AWS, Heroku, DigitalOcean, etc.)

3. Start the backend development server:
```bash
npm run dev
```

4. Start the backend production server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

**Note for Production**: Use HTTPS URL for `VITE_API_URL` in production (e.g., `https://api.yourdomain.com/api`)

4. Start the frontend development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

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

### More
Rooms, services, bookings, billing, service usage, feedback, reports, staff and admin routes are documented in [docs/api-overview.md](docs/api-overview.md).

## Database Seeding

Seed the database with initial data:

```bash
# Seed rooms (includes breakfast as free amenity)
npm run seed:rooms

# Seed services (laundry, meals, hair styling, theater, etc.)
npm run seed:services
```

## Backup

Create database backups:

```bash
npm run backup
```

This creates JSON backups of all collections in the `backups/` directory. Schedule this daily via cron job for production.

## Architecture

The backend follows strict MVC (Model-View-Controller) architecture:

- **Models**: Mongoose schemas and models
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, authorization, error handling
- **Services**: Reusable business logic (when needed)

For detailed architecture and API documentation, see:
- [Architecture Documentation](docs/architecture.md)
- [API Overview](docs/api-overview.md)

## Security & Performance

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Stateless authentication with access and refresh tokens
- **Role-Based Access Control**: All routes protected with role middleware
- **Database Indexes**: Optimized indexes for performance (supports 100+ concurrent users)
- **Pagination**: All list endpoints support pagination
- **HTTPS Ready**: Configured for HTTPS deployment via environment variables

## Deployment

### Production Checklist

1. **Environment Variables**: Update all URLs to HTTPS
2. **HTTPS Setup**: Use reverse proxy (Nginx) or cloud provider SSL
3. **Database**: Use MongoDB replica sets for high availability
4. **Backups**: Schedule daily backups via cron: `0 2 * * * cd /path/to/project && npm run backup`
5. **Monitoring**: Set up health check monitoring for `/api/health`
6. **Scaling**: Deploy multiple stateless Node.js instances behind load balancer

See [Architecture Documentation](docs/architecture.md) for detailed scaling and deployment strategies.

## Author

**Shimla** · GitHub: [@shimla50](https://github.com/shimla50)
