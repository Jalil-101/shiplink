'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { MapPin, Package, Clock, Truck, ArrowRight } from 'lucide-react';

interface TrackingOrder {
  _id: string;
  order_id: string;
  orderNumber: string;
  status: string;
  pickupLocation?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  dropoffLocation?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  latestTracking?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    status: string;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  estimatedDeliveryTime?: string;
}

export default function TrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrackingOrders();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchTrackingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingOrders = async () => {
    try {
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/tracking');
      setOrders(response.data.orders || []);
    } catch (err: any) {
      console.error('Error fetching tracking orders:', err);
      setError(err.response?.data?.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-100 text-blue-700',
      provider_assigned: 'bg-indigo-100 text-indigo-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      failed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Real-Time Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor active shipments in real-time</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Shipments</h3>
          <p className="text-gray-600">Active shipments will appear here for real-time tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/logistics-dashboard/tracking/${order._id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.orderNumber || order.order_id}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm text-gray-900 truncate">
                      {order.pickupLocation?.address || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-red-600 mt-1 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Delivery</p>
                    <p className="text-sm text-gray-900 truncate">
                      {order.dropoffLocation?.address || 'N/A'}
                    </p>
                  </div>
                </div>

                {order.latestTracking && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last update: {new Date(order.latestTracking.timestamp).toLocaleString()}
                  </div>
                )}

                {order.driverLocation && (
                  <div className="flex items-center text-xs text-green-600">
                    <Truck className="h-3 w-3 mr-1" />
                    Driver location available
                  </div>
                )}

                {order.estimatedDeliveryTime && (
                  <div className="flex items-center text-xs text-purple-600">
                    <Clock className="h-3 w-3 mr-1" />
                    ETA: {order.estimatedDeliveryTime}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



