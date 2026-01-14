'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { BarChart3, Package, DollarSign, Truck, TrendingUp, CheckCircle, Star } from 'lucide-react';
import { formatGHS } from '@/lib/currency';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
  };
  shipments: {
    total: number;
    byStatus: Record<string, number>;
  };
  performance: {
    averageDeliveryTime: number;
    onTimeRate: number;
    customerSatisfaction: number;
  };
}

export default function LogisticsAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/analytics');
      const data = response.data;
      
      // Calculate total revenue from ordersOverTime
      const totalRevenue = (data.ordersOverTime || []).reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
      const totalShipments = (data.ordersOverTime || []).reduce((sum: number, item: any) => sum + (item.count || 0), 0);
      
      // Transform backend response to frontend format
      const transformed: AnalyticsData = {
        revenue: {
          total: totalRevenue || 0,
          monthly: (data.ordersOverTime || []).map((item: any) => ({
            month: item._id || '',
            amount: item.revenue || 0
          }))
        },
        shipments: {
          total: totalShipments || 0,
          byStatus: (data.ordersByStatus || []).reduce((acc: Record<string, number>, item: any) => {
            acc[item._id || ''] = item.count || 0;
            return acc;
          }, {})
        },
        performance: {
          averageDeliveryTime: 0, // Not available from backend yet - would need order delivery times
          onTimeRate: 0, // Not available from backend yet - would need order completion tracking
          customerSatisfaction: 0 // Not available from backend yet - would need rating/review system
        }
      };
      
      setAnalytics(transformed);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">View your company's performance metrics</p>
      </div>

      {!analytics ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Analytics data will appear here as your company processes orders</p>
        </div>
      ) : (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.performance?.averageDeliveryTime || 0} days
              </p>
              <p className="text-sm text-gray-600 mt-1">Average Delivery Time</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.performance?.onTimeRate?.toFixed(1) || 0}%
              </p>
              <p className="text-sm text-gray-600 mt-1">On-Time Delivery Rate</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.performance?.customerSatisfaction?.toFixed(1) || 0} ⭐
              </p>
              <p className="text-sm text-gray-600 mt-1">Customer Satisfaction</p>
            </div>
          </div>

          {/* Revenue & Shipments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Revenue Overview
              </h2>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatGHS(analytics.revenue?.total || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
              {analytics.revenue?.monthly && analytics.revenue.monthly.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown</p>
                  <div className="space-y-2">
                    {analytics.revenue.monthly.slice(-6).map((month, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{month.month}</span>
                        <span className="font-medium text-gray-900">{formatGHS(month.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Shipments Overview
              </h2>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {analytics.shipments?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Total Shipments</p>
              {analytics.shipments?.byStatus && Object.keys(analytics.shipments.byStatus).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">By Status</p>
                  <div className="space-y-2">
                    {Object.entries(analytics.shipments.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-medium text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

