'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  orderId: {
    orderNumber: string;
    order_id: string;
  };
  customerId: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/invoices');
      setInvoices(response.data.invoices || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Clock },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: FileText };
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
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and track invoices</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Yet</h3>
          <p className="text-gray-600">Invoices will appear here once created from completed orders</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr
                    key={invoice._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/logistics-dashboard/billing/invoices/${invoice._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.orderId.orderNumber || invoice.orderId.order_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {invoice.customerId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
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



