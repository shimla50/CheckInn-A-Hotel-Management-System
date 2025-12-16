# CheckInn Frontend
React frontend for the CheckInn Hotel Management System.

## Tech Stack
- **React 18** - UI library
- **React Router v6** - Routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure
```
client/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Loader.jsx
│   ├── context/         # React Context
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StaffDashboard.jsx
│   │   ├── CustomerDashboard.jsx
│   │   └── NotFound.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Features
- **Authentication**: Login and registration forms
- **Protected Routes**: Role-based access control
- **Dashboard Pages**: Separate dashboards for Admin, Staff, and Customer
- **Token Management**: Automatic token refresh and storage
- **API Integration**: Axios instance with interceptors for auth

## Routes
- `/login` - Login page
- `/register` - Registration page
- `/admin/dashboard` - Admin dashboard (Admin only)
- `/staff/dashboard` - Staff dashboard (Staff only)
- `/customer/dashboard` - Customer dashboard (Customer only)
- `/*` - 404 Not Found page

## Authentication Flow
1. User logs in/registers
2. Access token stored in localStorage
3. Refresh token stored in HTTP-only cookie
4. Token automatically refreshed on 401 errors
5. User redirected to appropriate dashboard based on role

