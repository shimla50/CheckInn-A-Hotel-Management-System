/**
 * @fileoverview Admin reports dashboard with revenue, occupancy, and service analytics
 * @module pages/AdminReportsDashboard
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import formatCurrency from '../utils/formatCurrency';
import './AdminReportsDashboard.css';

const AdminReportsDashboard = () => {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const COLORS = ['#3498db', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6'];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllReports();
    }
  }, [user, period]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch revenue summary
      const revenueResponse = await api.get(
        `/admin/reports/revenue?period=${period}`
      );
      setRevenueData(revenueResponse.data.data);

      // Fetch occupancy stats (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const occupancyResponse = await api.get(
        `/admin/reports/occupancy?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      setOccupancyData(occupancyResponse.data.data);

      // Fetch top services
      const servicesResponse = await api.get('/admin/reports/top-services?limit=5');
      setTopServices(servicesResponse.data.data.topServices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleCustomDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please provide both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const revenueResponse = await api.get(
        `/admin/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setRevenueData(revenueResponse.data.data);

      const occupancyResponse = await api.get(
        `/admin/reports/occupancy?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setOccupancyData(occupancyResponse.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="admin-only">Admin access required</div>;
  }

  if (loading && !revenueData) {
    return <Loader />;
  }

  return (
    <div className="admin-reports-dashboard">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="header-controls">
          <select
            value={period}
            onChange={handlePeriodChange}
            className="period-select"
          >
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">This Month</option>
          </select>
          <button className="btn-refresh" onClick={fetchAllReports}>
            Refresh
          </button>
        </div>
      </div>

      <div className="custom-date-range">
        <h3>Custom Date Range</h3>
        <div className="date-inputs">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
          />
          <button className="btn-primary" onClick={handleCustomDateRange}>
            Apply
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Revenue Summary Cards */}
      {revenueData && (
        <div className="stats-grid">
          <div className="stat-card revenue-card">
            <h3>Total Revenue</h3>
            <div className="stat-value">
              {formatCurrency(revenueData.totalRevenue)}
            </div>
            <div className="stat-label">
              {revenueData.transactionCount} transactions
            </div>
          </div>

          <div className="stat-card occupancy-card">
            <h3>Occupancy Rate</h3>
            <div className="stat-value">
              {occupancyData
                ? `${occupancyData.occupancyPercentage.toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="stat-label">
              {occupancyData
                ? `${occupancyData.bookedRoomNights} / ${occupancyData.totalRoomNights} room nights`
                : ''}
            </div>
          </div>

          <div className="stat-card services-card">
            <h3>Top Services Revenue</h3>
            <div className="stat-value">
              {topServices.length > 0
                ? formatCurrency(
                    topServices.reduce((sum, s) => sum + s.totalRevenue, 0)
                  )
                : formatCurrency(0)}
            </div>
            <div className="stat-label">
              {topServices.length} top services
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueData && revenueData.dailyBreakdown && (
        <div className="chart-card">
          <h2>Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3498db"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by Payment Method */}
      {revenueData && revenueData.revenueByMethod && (
        <div className="chart-card">
          <h2>Revenue by Payment Method</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(revenueData.revenueByMethod).map(([method, amount]) => ({
              method: method.toUpperCase(),
              revenue: amount,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#27ae60" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Occupancy Chart */}
      {occupancyData && occupancyData.dailyOccupancy && (
        <div className="chart-card">
          <h2>Daily Occupancy Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyData.dailyOccupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => `${value.toFixed(1)}%`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="occupancyPercentage"
                stroke="#e74c3c"
                strokeWidth={2}
                name="Occupancy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Services */}
      {topServices.length > 0 && (
        <div className="chart-card">
          <h2>Top Services by Revenue</h2>
          <div className="services-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topServices.map((service) => ({
                  name: service.serviceName,
                  revenue: service.totalRevenue,
                  quantity: service.totalQuantity,
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#9b59b6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="services-table">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Unit Price</th>
                  <th>Total Quantity</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((service) => (
                  <tr key={service.serviceId}>
                    <td>{service.serviceName}</td>
                    <td>{formatCurrency(service.unitPrice)}</td>
                    <td>{service.totalQuantity}</td>
                    <td className="revenue-cell">
                      {formatCurrency(service.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsDashboard;

