'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, Truck, Package, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalDrivers: number;
  pendingVerifications: number;
  totalDeliveries: number;
  activeDeliveries: number;
  suspendedUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [usersRes, driversRes, deliveriesRes] = await Promise.all([
        api.get('/users?limit=1'),
        api.get('/drivers?limit=1'),
        api.get('/deliveries?limit=1'),
      ]);

      const [pendingDriversRes, suspendedUsersRes, activeDeliveriesRes] = await Promise.all([
        api.get('/drivers/pending'),
        api.get('/users?isSuspended=true&limit=1'),
        api.get('/deliveries?status=in-transit&limit=1'),
      ]);

      setStats({
        totalUsers: usersRes.data.pagination.total,
        totalDrivers: driversRes.data.pagination.total,
        pendingVerifications: pendingDriversRes.data.count || 0,
        totalDeliveries: deliveriesRes.data.pagination.total,
        activeDeliveries: activeDeliveriesRes.data.pagination.total,
        suspendedUsers: suspendedUsersRes.data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/dashboard/users',
    },
    {
      name: 'Total Drivers',
      value: stats?.totalDrivers || 0,
      icon: Truck,
      color: 'bg-green-500',
      href: '/dashboard/drivers',
    },
    {
      name: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      href: '/dashboard/drivers?status=pending',
    },
    {
      name: 'Total Deliveries',
      value: stats?.totalDeliveries || 0,
      icon: Package,
      color: 'bg-purple-500',
      href: '/dashboard/deliveries',
    },
    {
      name: 'Active Deliveries',
      value: stats?.activeDeliveries || 0,
      icon: CheckCircle,
      color: 'bg-indigo-500',
      href: '/dashboard/deliveries?status=in-transit',
    },
    {
      name: 'Suspended Users',
      value: stats?.suspendedUsers || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      href: '/dashboard/users?isSuspended=true',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the ShipLink Admin Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

