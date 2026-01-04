/**
 * @fileoverview Main App component with routing
 * @module App
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminRoomsPage from './pages/AdminRoomsPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminFeedbackManagement from './pages/AdminFeedbackManagement';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminStaffAccountsPage from './pages/AdminStaffAccountsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import CustomerRoomsSearchPage from './pages/CustomerRoomsSearchPage';
import CustomerBookingPage from './pages/CustomerBookingPage';
import CustomerBookingsPage from './pages/CustomerBookingsPage';
import CustomerPaymentsPage from './pages/CustomerPaymentsPage';
import StaffBookingsDashboard from './pages/StaffBookingsDashboard';
import StaffServicesPage from './pages/StaffServicesPage';
import FrontDeskDashboard from './pages/FrontDeskDashboard';
import BillingPage from './pages/BillingPage';
import AdminReportsDashboard from './pages/AdminReportsDashboard';
import CustomerFeedbackPage from './pages/CustomerFeedbackPage';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected dashboard routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin management routes */}
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRoomsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminServicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <AdminBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReportsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <AdminFeedbackManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminStaffAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPaymentsPage />
                </ProtectedRoute>
              }
            />

            {/* Customer routes */}
            <Route
              path="/customer/rooms"
              element={
                <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                  <CustomerRoomsSearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/bookings"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/payments"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerPaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/feedback"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerFeedbackPage />
                </ProtectedRoute>
              }
            />

            {/* Staff routes */}
            <Route
              path="/staff/bookings"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <StaffBookingsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/front-desk"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <FrontDeskDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/billing"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/services"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <StaffServicesPage />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;

