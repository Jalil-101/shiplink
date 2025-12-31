'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Activity, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SystemHealth {
  status: string;
  database: {
    status: string;
    connected: boolean;
  };
  activity: {
    recentUsers: number;
    recentDeliveries: number;
    pendingDeliveries: number;
    stuckDeliveries: number;
  };
  timestamp: string;
}

export default function SystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await api.get('/system/health');
      setHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
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

  if (!health) {
    return <div>Error loading system health</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor system status and performance</p>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {health.status === 'healthy' ? (
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-500 mr-3" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                System Status: <span className="capitalize">{health.status}</span>
              </h2>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database
        </h2>
        <div className="flex items-center">
          {health.database.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className="text-gray-700 capitalize">{health.database.status}</span>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Users</p>
              <p className="text-2xl font-bold text-gray-900">{health.activity.recentUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Last hour</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{health.activity.recentDeliveries}</p>
              <p className="text-xs text-gray-500 mt-1">Last hour</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{health.activity.pendingDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Stuck Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{health.activity.stuckDeliveries}</p>
              <p className="text-xs text-gray-500 mt-1">Older than 24h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

