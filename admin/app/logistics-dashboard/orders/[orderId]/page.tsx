'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  Weight,
  Ruler,
  FileText,
  ArrowLeft,
  Calendar as CalendarIcon,
  UserPlus,
  Save,
  MessageSquare
} from 'lucide-react';
import { formatGHS } from '@/lib/currency';

interface OrderDetails {
  _id: string;
  order_id: string;
  orderNumber: string;
  order_type: string;
  status: string;
  userId: {
    name: string;
    email: string;
    phone: string;
  };
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
  packageDetails?: {
    weight?: number;
    weightUnit?: string;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    contentDescription?: string;
  };
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceAtTime: number;
    subtotal: number;
  }>;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_payout: number;
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  assignedAt?: string;
  driverId?: string;
  distance?: number;
  notes?: string;
  scheduledPickup?: {
    date: string;
    time?: string;
    notes?: string;
  };
  scheduledDelivery?: {
    date: string;
    time?: string;
    notes?: string;
  };
  driver?: {
    _id: string;
    vehicleType: string;
    vehicleModel: string;
    vehiclePlate: string;
  };
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [showSchedulePickup, setShowSchedulePickup] = useState(false);
  const [showScheduleDelivery, setShowScheduleDelivery] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    notes: ''
  });
  const [selectedDriverId, setSelectedDriverId] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchDrivers();
    }
  }, [orderId]);

  const fetchDrivers = async () => {
    try {
      const response = await logisticsApi.get('/logistics-companies/dashboard/drivers');
      setDrivers(response.data.drivers || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get(`/logistics-companies/dashboard/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setScheduling(true);
      setError('');
      await logisticsApi.post(`/logistics-companies/dashboard/orders/${orderId}/schedule-pickup`, scheduleForm);
      setShowSchedulePickup(false);
      setScheduleForm({ date: '', time: '', notes: '' });
      fetchOrderDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule pickup');
    } finally {
      setScheduling(false);
    }
  };

  const handleScheduleDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setScheduling(true);
      setError('');
      await logisticsApi.post(`/logistics-companies/dashboard/orders/${orderId}/schedule-delivery`, scheduleForm);
      setShowScheduleDelivery(false);
      setScheduleForm({ date: '', time: '', notes: '' });
      fetchOrderDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule delivery');
    } finally {
      setScheduling(false);
    }
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setError('Please select a driver');
      return;
    }
    try {
      setAssigning(true);
      setError('');
      await logisticsApi.post(`/logistics-companies/dashboard/orders/${orderId}/assign-driver`, {
        driverId: selectedDriverId
      });
      setShowAssignDriver(false);
      setSelectedDriverId('');
      fetchOrderDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      created: { label: 'New Request', color: 'bg-blue-100 text-blue-700', icon: Clock },
      provider_assigned: { label: 'Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Package },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Truck },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Package };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Order not found'}
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              {order.orderNumber || order.order_id}
            </p>
          </div>
          <span className={`px-4 py-2 inline-flex items-center text-sm font-medium rounded-full ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900 font-medium">{order.userId.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{order.userId.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{order.userId.phone}</span>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-purple-600" />
              Locations
            </h2>
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
              {order.distance && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                  <p className="text-gray-900">{order.distance.toFixed(2)} km</p>
                </div>
              )}
            </div>
          </div>

          {/* Package Details */}
          {order.packageDetails && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Package Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {order.packageDetails.weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <p className="text-gray-900 flex items-center">
                      <Weight className="h-4 w-4 mr-1" />
                      {order.packageDetails.weight} {order.packageDetails.weightUnit || 'kg'}
                    </p>
                  </div>
                )}
                {order.packageDetails.dimensions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                    <p className="text-gray-900 flex items-center">
                      <Ruler className="h-4 w-4 mr-1" />
                      {order.packageDetails.dimensions.length} × {order.packageDetails.dimensions.width} × {order.packageDetails.dimensions.height} cm
                    </p>
                  </div>
                )}
                {order.packageDetails.contentDescription && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{order.packageDetails.contentDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items (for marketplace orders) */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatGHS(item.priceAtTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatGHS(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-4">
                {order.statusHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-purple-600 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {entry.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.changedAt).toLocaleString()}
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-gray-600 mt-1">{entry.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Notes
              </h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
              Financial Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Amount</span>
                <span className="font-medium text-gray-900">{formatGHS(order.gross_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission ({order.commission_rate}%)</span>
                <span className="font-medium text-gray-900">{formatGHS(order.commission_amount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Your Payout</span>
                <span className="font-bold text-purple-600">{formatGHS(order.provider_payout)}</span>
              </div>
            </div>
          </div>

          {/* Scheduling & Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling & Actions</h2>
            <div className="space-y-3">
              {/* Scheduled Pickup */}
              {order.scheduledPickup?.date ? (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">Pickup Scheduled</p>
                  <p className="text-xs text-gray-600">
                    {new Date(order.scheduledPickup.date).toLocaleDateString()}
                    {order.scheduledPickup.time && ` at ${order.scheduledPickup.time}`}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowSchedulePickup(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Pickup
                </button>
              )}

              {/* Scheduled Delivery */}
              {order.scheduledDelivery?.date ? (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">Delivery Scheduled</p>
                  <p className="text-xs text-gray-600">
                    {new Date(order.scheduledDelivery.date).toLocaleDateString()}
                    {order.scheduledDelivery.time && ` at ${order.scheduledDelivery.time}`}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowScheduleDelivery(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Delivery
                </button>
              )}

              {/* Driver Assignment */}
              {order.driver ? (
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">Driver Assigned</p>
                  <p className="text-xs text-gray-600">
                    {order.driver.vehicleType} - {order.driver.vehicleModel} ({order.driver.vehiclePlate})
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAssignDriver(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Driver
                </button>
              )}

              <button
                onClick={() => router.push(`/logistics-dashboard/orders/${orderId}/documents`)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </button>

              <button
                onClick={() => router.push(`/logistics-dashboard/chat/${orderId}`)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Customer
              </button>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Order Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <p className="text-gray-900 capitalize">{order.order_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
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
              {order.assignedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned At</label>
                  <p className="text-gray-900">{new Date(order.assignedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Pickup Modal */}
      {showSchedulePickup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Pickup</h3>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
            <form onSubmit={handleSchedulePickup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSchedulePickup(false);
                    setScheduleForm({ date: '', time: '', notes: '' });
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Delivery Modal */}
      {showScheduleDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Delivery</h3>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
            <form onSubmit={handleScheduleDelivery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  required
                  min={order.scheduledPickup?.date || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleDelivery(false);
                    setScheduleForm({ date: '', time: '', notes: '' });
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Driver</h3>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver *</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="">Choose a driver...</option>
                  {drivers.length === 0 ? (
                    <option value="" disabled>No drivers available</option>
                  ) : (
                    drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.userId?.name || 'Unknown'} - {driver.vehicleType} {driver.vehicleModel} ({driver.vehiclePlate}) {driver.isAvailable ? '(Available)' : '(Unavailable)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignDriver(false);
                    setSelectedDriverId('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

