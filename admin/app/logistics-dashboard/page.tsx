'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import { Package, Users, DollarSign, Truck } from 'lucide-react';
import logisticsApi from '@/lib/logisticsApi';

interface DashboardStats {
  totalShipments: number;
  activeDrivers: number;
  totalRevenue: number;
  pendingDeliveries: number;
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
        pendingDeliveries: overview.orders?.pending || 0,
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
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
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

      {/* Additional content can be added here */}
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

