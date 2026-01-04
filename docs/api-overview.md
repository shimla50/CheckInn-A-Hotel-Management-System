# CheckInn API Overview

This document provides an overview of all API endpoints organized by module.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.yourdomain.com/api`

## Authentication

Most endpoints require authentication via JWT token:
- **Header**: `Authorization: Bearer <token>`
- **Cookie**: `token` (HTTP-only cookie for refresh tokens)

## Response Format

All responses follow this structure:
```json
{
  "success": true|false,
  "message": "Description",
  "data": { ... },
  "statusCode": 200
}
```

---

## 1. Authentication Module (`/api/auth`)

### Public Endpoints

- `POST /api/auth/register` - Register new user (admin/staff/customer)
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password using token

---

## 2. User Module (`/api/users`)

### Protected Endpoints

- `GET /api/users/me` - Get current authenticated user

---

## 3. Room Module (`/api/rooms`)

### Protected Endpoints

- `GET /api/rooms` - List rooms (paginated, filtered by status/type)
  - Query params: `status`, `type`, `page`, `limit`
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (Admin only)
- `PUT /api/rooms/:id` - Update room (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

---

## 4. Service Module (`/api/services`)

### Protected Endpoints

- `GET /api/services` - List services (filtered by isActive)
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service (Admin only)
- `PUT /api/services/:id` - Update service (Admin only)
- `DELETE /api/services/:id` - Delete service (Admin only)

---

## 5. Booking Module (`/api/bookings`)

### Protected Endpoints

- `GET /api/bookings/my-bookings` - Get current user's bookings (Customer)
  - Query params: `status`, `page`, `limit`
- `GET /api/bookings` - List all bookings (Staff/Admin)
  - Query params: `status`, `checkInDate`, `checkOutDate`, `roomId`, `guestId`, `page`, `limit`
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/approve` - Approve booking (Staff/Admin)
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/check-in` - Check-in guest (Staff/Admin)
- `POST /api/bookings/:id/check-out` - Check-out guest (Staff/Admin)
- `GET /api/bookings/front-desk/overview` - Get front desk overview (Staff/Admin)

---

## 6. Billing Module (`/api/billing`)

### Protected Endpoints

- `GET /api/billing/bookings/:bookingId/invoice` - Generate invoice for booking
- `POST /api/billing/bookings/:bookingId/payment` - Record payment
- `POST /api/billing/bookings/:bookingId/pay/sslcommerz` - Initiate SSLCommerz payment (Customer)
- `GET /api/billing/bookings/:bookingId/payments` - Get payment history
- `GET /api/billing/sslcommerz/mock-payment` - Mock payment page (Development)
- `POST /api/billing/sslcommerz/success` - SSLCommerz success callback
- `POST /api/billing/sslcommerz/fail` - SSLCommerz failure callback
- `POST /api/billing/sslcommerz/cancel` - SSLCommerz cancel callback
- `POST /api/billing/sslcommerz/ipn` - SSLCommerz IPN endpoint

---

## 7. Service Usage Module (`/api/service-usage`)

### Protected Endpoints

- `GET /api/service-usage/booking/:bookingId` - Get services for a booking
- `POST /api/service-usage` - Add service to booking (Staff/Admin)
- `PUT /api/service-usage/:id` - Update service usage (Staff/Admin)
- `DELETE /api/service-usage/:id` - Remove service from booking (Staff/Admin)

---

## 8. Feedback Module (`/api/feedback`)

### Protected Endpoints

- `POST /api/feedback` - Create feedback (Customer)
- `GET /api/feedback/my-feedback` - Get current user's feedback (Customer)
- `GET /api/feedback` - List all feedback (Staff/Admin)
  - Query params: `rating`, `startDate`, `endDate`, `hasResponse`, `page`, `limit`
- `POST /api/feedback/:id/respond` - Respond to feedback (Staff/Admin)

---

## 9. Admin Module (`/api/admin`)

### Admin Only Endpoints

- `GET /api/admin/summary` - Get admin summary statistics
- `GET /api/admin/users` - List all users
  - Query params: `role`, `isActive`, `page`, `limit`
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Update user status (activate/deactivate)
- `GET /api/admin/settings` - Get system settings
- `PATCH /api/admin/settings` - Update system settings
- `POST /api/admin/staff` - Create staff account
- `GET /api/admin/staff` - List all staff accounts
- `GET /api/admin/payments` - List all payment transactions
  - Query params: `bookingId`, `status`, `paymentMethod`, `startDate`, `endDate`, `page`, `limit`
- `POST /api/admin/notifications/send-checkin-reminders` - Send check-in reminders (Admin/Staff)
- `POST /api/admin/notifications/send-promotion` - Send promotion emails (Admin)

---

## 10. Reports Module (`/api/admin/reports`)

### Admin Only Endpoints

- `GET /api/admin/reports/revenue` - Get revenue summary
  - Query params: `period` (daily/weekly/monthly), `startDate`, `endDate`
- `GET /api/admin/reports/occupancy` - Get occupancy statistics
  - Query params: `startDate`, `endDate` (required)
- `GET /api/admin/reports/top-services` - Get top services by revenue
  - Query params: `limit`, `startDate`, `endDate`

---

## 11. Dashboard Module (`/api/*/dashboard`)

### Protected Endpoints

- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/staff/dashboard` - Staff dashboard data
- `GET /api/customer/dashboard` - Customer dashboard data

---

## 12. Customer Module (`/api/customer`)

### Customer Only Endpoints

- `GET /api/customer/my-bookings/summary` - Get booking summary

---

## Data Models

### User
- `_id`, `name`, `email`, `password` (hashed), `role`, `isActive`, `createdAt`

### Room
- `_id`, `code`, `type`, `pricePerNight`, `amenities[]`, `status`, `maxGuests`, `createdAt`, `updatedAt`

### Booking
- `_id`, `guest` (User ref), `room` (Room ref), `checkInDate`, `checkOutDate`, `status`, `totalNights`, `totalAmount`, `createdBy` (User ref), `createdAt`, `updatedAt`

### Service
- `_id`, `name`, `description`, `price`, `isActive`, `createdAt`, `updatedAt`

### ServiceUsage
- `_id`, `booking` (Booking ref), `service` (Service ref), `quantity`, `amount`, `createdAt`, `updatedAt`

### Payment
- `_id`, `booking` (Booking ref), `amount`, `paymentMethod`, `status`, `transactionId`, `invoiceNumber`, `createdAt`

### Feedback
- `_id`, `customer` (User ref), `booking` (Booking ref, optional), `rating`, `comment`, `responseFromStaff`, `createdAt`

### Notification
- `_id`, `user` (User ref), `type`, `title`, `message`, `isRead`, `metadata`, `createdAt`

---

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently not implemented. For production, consider adding rate limiting middleware.

---

## Pagination

Most list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10-20)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

