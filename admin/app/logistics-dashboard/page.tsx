'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import { Package, Users, DollarSign, Truck, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import logisticsApi from '@/lib/logisticsApi';
import { formatGHS } from '@/lib/currency';

interface DashboardStats {
  totalShipments: number;
  activeDrivers: number;
  totalRevenue: number;
  pendingDeliveries: number;
  statusBreakdown?: {
    created: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    failed: number;
  };
}

export default function LogisticsDashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      // Use the logistics dashboard API endpoint
      const response = await logisticsApi.get('/logistics-companies/dashboard/overview');

      const overview = response.data.overview || {};
      setStats({
        totalShipments: overview.orders?.total || 0,
        activeDrivers: overview.drivers?.active || 0,
        totalRevenue: overview.revenue?.total || 0,
        pendingDeliveries: (overview.orders?.byStatus?.created || 0) + (overview.orders?.byStatus?.assigned || 0),
        statusBreakdown: overview.orders?.byStatus || {
          created: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          failed: 0
        }
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your shipping operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalShipments}</p>
          <p className="text-sm text-gray-600 mt-1">Total Shipments</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeDrivers}</p>
          <p className="text-sm text-gray-600 mt-1">Active Drivers</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatGHS(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
          <p className="text-sm text-gray-600 mt-1">Pending Deliveries</p>
        </div>
      </div>

      {/* Shipment Status Breakdown */}
      {stats.statusBreakdown && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=created')}
              className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Created</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.created}</p>
            </button>
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=provider_assigned')}
              className="p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Assigned</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.assigned}</p>
            </button>
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=in_progress')}
              className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <Truck className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.inProgress}</p>
            </button>
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=completed')}
              className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.completed}</p>
            </button>
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=cancelled')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <XCircle className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Cancelled</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.cancelled}</p>
            </button>
            <button
              onClick={() => router.push('/logistics-dashboard/orders?status=failed')}
              className="p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left transition-colors"
            >
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Failed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.statusBreakdown.failed}</p>
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/logistics-dashboard/orders')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <Package className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">View Orders</p>
            <p className="text-sm text-gray-600 mt-1">Manage booking requests</p>
          </button>
          <button
            onClick={() => router.push('/logistics-dashboard/drivers')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Manage Drivers</p>
            <p className="text-sm text-gray-600 mt-1">View and manage drivers</p>
          </button>
          <button
            onClick={() => router.push('/logistics-dashboard/profile')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <Truck className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Company Profile</p>
            <p className="text-sm text-gray-600 mt-1">Update company information</p>
          </button>
        </div>
      </div>
    </div>
  );
}

