'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatGHS } from '@/lib/currency';

interface Quote {
  _id: string;
  quoteNumber: string;
  customerId: {
    name: string;
    email: string;
  };
  origin: { address: string };
  destination: { address: string };
  calculatedCost: number;
  status: string;
  validityPeriod: {
    end: string;
  };
  createdAt: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/quotes');
      setQuotes(response.data.quotes || []);
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.response?.data?.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: XCircle },
      converted: { label: 'Converted', color: 'bg-purple-100 text-purple-700', icon: CheckCircle }
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage freight cost quotes</p>
        </div>
        <button
          onClick={() => router.push('/logistics-dashboard/quotes/create')}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Quote
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotes Yet</h3>
          <p className="text-gray-600 mb-4">Create quotes to provide freight cost estimates to customers</p>
          <button
            onClick={() => router.push('/logistics-dashboard/quotes/create')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create First Quote
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote) => {
                const statusConfig = getStatusConfig(quote.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr
                    key={quote._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/logistics-dashboard/quotes/${quote._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.quoteNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {quote.customerId.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <p className="truncate">{quote.origin.address}</p>
                        <p className="text-gray-500 text-xs mt-1">→ {quote.destination.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatGHS(quote.calculatedCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.validityPeriod.end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
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




