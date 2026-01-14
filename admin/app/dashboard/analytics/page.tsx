'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { BarChart3, Users, Package, DollarSign, TrendingUp } from 'lucide-react';
import { formatGHS } from '@/lib/currency';

interface Overview {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  drivers: {
    total: number;
    approved: number;
    pendingVerification: number;
  };
  deliveries: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    completed: number;
    pending: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/analytics/overview');
      setOverview(response.data.overview);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!overview) {
    return <div>Error loading analytics</div>;
  }

  const statCards = [
    {
      name: 'Total Users',
      value: overview.users.total,
      change: `${overview.users.active} active`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Drivers',
      value: overview.drivers.total,
      change: `${overview.drivers.approved} approved`,
      icon: BarChart3,
      color: 'bg-green-500',
    },
    {
      name: 'Total Deliveries',
      value: overview.deliveries.total,
      change: `${overview.deliveries.thisMonth} this month`,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Revenue',
      value: formatGHS(overview.revenue?.total || 0),
      change: `${formatGHS(overview.revenue?.thisMonth || 0)} this month`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Platform statistics and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-gray-900">{overview.users.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Suspended Users</span>
              <span className="font-semibold text-red-600">{overview.users.suspended}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">{overview.users.total}</span>
            </div>
          </div>
        </div>

        {/* Deliveries Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{overview.deliveries.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{overview.deliveries.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Week</span>
              <span className="font-semibold text-gray-900">{overview.deliveries.thisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-gray-900">{overview.deliveries.thisMonth}</span>
            </div>
          </div>
        </div>

        {/* Drivers Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Approved Drivers</span>
              <span className="font-semibold text-green-600">{overview.drivers.approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Verification</span>
              <span className="font-semibold text-yellow-600">{overview.drivers.pendingVerification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Drivers</span>
              <span className="font-semibold text-gray-900">{overview.drivers.total}</span>
            </div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">{formatGHS(overview.revenue?.total || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-green-600">{formatGHS(overview.revenue?.thisMonth || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




