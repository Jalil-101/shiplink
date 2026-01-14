'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { FileText, ArrowLeft, Download, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

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
    phone: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get(`/logistics-companies/dashboard/invoices/${invoiceId}`);
      setInvoice(response.data.invoice);
    } catch (err: any) {
      console.error('Error fetching invoice details:', err);
      setError(err.response?.data?.message || 'Failed to load invoice details');
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

  if (error || !invoice) {
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
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Invoices
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
            <p className="mt-1 text-sm text-gray-500">{invoice.invoiceNumber}</p>
          </div>
          <span className={`px-4 py-2 inline-flex items-center text-sm font-medium rounded-full ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-900 font-medium">{invoice.customerId.name}</p>
              <p className="text-sm text-gray-600">{invoice.customerId.email}</p>
              {invoice.customerId.phone && (
                <p className="text-sm text-gray-600">{invoice.customerId.phone}</p>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-purple-600">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <p className="text-gray-900">{invoice.orderId.orderNumber || invoice.orderId.order_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <p className="text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              {invoice.paidAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid At</label>
                  <p className="text-gray-900">{new Date(invoice.paidAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(invoice.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



