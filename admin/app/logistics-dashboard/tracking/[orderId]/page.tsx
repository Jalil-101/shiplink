'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { MapPin, Clock, Truck, ArrowLeft, Navigation } from 'lucide-react';

interface TrackingData {
  order: {
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
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
  };
  trackingHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    status: string;
    carrier?: string;
    notes?: string;
  }>;
  driverLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  driver?: {
    _id: string;
    vehicleType: string;
    vehicleModel: string;
    vehiclePlate: string;
  };
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchTrackingData();
      // Refresh every 10 seconds for real-time updates
      const interval = setInterval(fetchTrackingData, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get(`/logistics-companies/dashboard/tracking/${orderId}`);
      setTrackingData(response.data);
    } catch (err: any) {
      console.error('Error fetching tracking data:', err);
      setError(err.response?.data?.message || 'Failed to load tracking data');
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

  if (error || !trackingData) {
    return (
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Tracking data not found'}
        </div>
      </div>
    );
  }

  const { order, trackingHistory, driverLocation, driver } = trackingData;
  const latestTracking = trackingHistory && trackingHistory.length > 0
    ? trackingHistory[trackingHistory.length - 1]
    : null;

  // Generate Google Maps URL for route visualization
  const getMapUrl = (): string | undefined => {
    const waypoints = [];
    if (order.pickupLocation?.latitude && order.pickupLocation?.longitude) {
      waypoints.push(`${order.pickupLocation.latitude},${order.pickupLocation.longitude}`);
    }
    if (latestTracking) {
      waypoints.push(`${latestTracking.latitude},${latestTracking.longitude}`);
    }
    if (order.dropoffLocation?.latitude && order.dropoffLocation?.longitude) {
      waypoints.push(`${order.dropoffLocation.latitude},${order.dropoffLocation.longitude}`);
    }
    
    if (waypoints.length >= 2) {
      return `https://www.google.com/maps/dir/${waypoints.join('/')}`;
    }
    return undefined;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Tracking
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          {order.orderNumber || order.order_id}
        </p>
      </div>

      {/* Map Link */}
      {(() => {
        const mapUrl = getMapUrl();
        return mapUrl ? (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Navigation className="h-5 w-5 mr-2" />
              View Route on Google Maps
            </a>
          </div>
        ) : null;
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Location */}
          {latestTracking && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Current Location
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Coordinates:</strong> {latestTracking.latitude.toFixed(6)}, {latestTracking.longitude.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Update:</strong> {new Date(latestTracking.timestamp).toLocaleString()}
                </p>
                {latestTracking.carrier && (
                  <p className="text-sm text-gray-600">
                    <strong>Carrier:</strong> {latestTracking.carrier}
                  </p>
                )}
                {latestTracking.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {latestTracking.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Driver Location */}
          {driverLocation && driver && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600" />
                Driver Location
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Vehicle:</strong> {driver.vehicleType} - {driver.vehicleModel} ({driver.vehiclePlate})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Coordinates:</strong> {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Update:</strong> {new Date(driverLocation.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Locations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Locations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                <p className="text-gray-900">{order.pickupLocation?.address || 'N/A'}</p>
                {order.pickupLocation?.latitude && order.pickupLocation?.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    {order.pickupLocation.latitude.toFixed(6)}, {order.pickupLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                <p className="text-gray-900">{order.dropoffLocation?.address || 'N/A'}</p>
                {order.dropoffLocation?.latitude && order.dropoffLocation?.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    {order.dropoffLocation.latitude.toFixed(6)}, {order.dropoffLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tracking History */}
          {trackingHistory && trackingHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-600" />
                Tracking History
              </h2>
              <div className="space-y-4">
                {trackingHistory.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-start border-l-2 border-purple-200 pl-4">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-purple-600 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.status && (
                        <p className="text-xs text-gray-600 mt-1">
                          Status: {entry.status.replace('_', ' ')}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-gray-900 capitalize">{order.status.replace('_', ' ')}</p>
              </div>
              {order.estimatedDeliveryTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                  <p className="text-gray-900">{order.estimatedDeliveryTime}</p>
                </div>
              )}
              {order.actualDeliveryTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Delivery</label>
                  <p className="text-gray-900">{new Date(order.actualDeliveryTime).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/logistics-dashboard/orders/${orderId}`)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                View Order Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

