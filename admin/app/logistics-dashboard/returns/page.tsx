'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { RotateCcw, Clock, CheckCircle, XCircle, Package } from 'lucide-react';

interface ReturnRequest {
  _id: string;
  returnNumber: string;
  originalOrderId: {
    orderNumber: string;
    order_id: string;
  };
  customerId: {
    name: string;
    email: string;
  };
  returnType: string;
  reason: string;
  status: string;
  scheduledPickup?: {
    date: string;
    time?: string;
  };
  createdAt: string;
}

export default function ReturnsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/returns');
      setReturns(response.data.returns || []);
    } catch (err: any) {
      console.error('Error fetching returns:', err);
      setError(err.response?.data?.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      requested: { label: 'Requested', color: 'bg-blue-100 text-blue-700', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700', icon: Clock },
      in_transit: { label: 'In Transit', color: 'bg-yellow-100 text-yellow-700', icon: Package },
      received: { label: 'Received', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
      processed: { label: 'Processed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: RotateCcw };
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
        <h1 className="text-2xl font-bold text-gray-900">Returns & Pickups</h1>
        <p className="mt-1 text-sm text-gray-500">Manage return requests and reverse logistics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {returns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <RotateCcw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Return Requests</h3>
          <p className="text-gray-600">Return and pickup requests will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map((returnReq) => {
                const statusConfig = getStatusConfig(returnReq.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr
                    key={returnReq._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/logistics-dashboard/returns/${returnReq._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {returnReq.returnNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnReq.originalOrderId.orderNumber || returnReq.originalOrderId.order_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {returnReq.customerId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {returnReq.returnType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {returnReq.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(returnReq.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

