'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { DollarSign, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface BillingStats {
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalInvoices: number;
}

interface RecentInvoice {
  _id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  dueDate: string;
  customerId: {
    name: string;
  };
}

export default function BillingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      // Fetch invoices
      const invoicesResponse = await logisticsApi.get('/logistics-companies/dashboard/invoices', {
        params: { limit: 100 }
      });

      const invoices = invoicesResponse.data.invoices || [];
      
      // Calculate stats
      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.total, 0);
      
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'sent').length;
      const overdueInvoices = invoices.filter((inv: any) => {
        return inv.status === 'overdue' || 
               (inv.status === 'sent' && new Date(inv.dueDate) < new Date());
      }).length;

      setStats({
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalInvoices: invoices.length
      });

      // Get recent invoices
      setRecentInvoices(invoices.slice(0, 5));
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError(err.response?.data?.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
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
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Track revenue, invoices, and payments</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.paidInvoices}</p>
          <p className="text-sm text-gray-600 mt-1">Paid Invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingInvoices}</p>
          <p className="text-sm text-gray-600 mt-1">Pending Invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.overdueInvoices}</p>
          <p className="text-sm text-gray-600 mt-1">Overdue Invoices</p>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <button
            onClick={() => router.push('/logistics-dashboard/billing/invoices')}
            className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/logistics-dashboard/billing/invoices/${invoice._id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerId.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">${invoice.total.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/logistics-dashboard/billing/invoices')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <FileText className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">View All Invoices</p>
            <p className="text-sm text-gray-600 mt-1">Manage and track all invoices</p>
          </button>
          <button
            onClick={() => router.push('/logistics-dashboard/quotes')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Manage Quotes</p>
            <p className="text-sm text-gray-600 mt-1">Create and manage freight quotes</p>
          </button>
        </div>
      </div>
    </div>
  );
}

