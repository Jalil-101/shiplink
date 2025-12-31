'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Earnings {
  totalRevenue: number;
  periodRevenue: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export default function FinancialPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/financial/earnings');
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
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

  if (!earnings) {
    return <div>Error loading financial data</div>;
  }

  const cards = [
    {
      name: 'Total Revenue',
      value: `$${earnings.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'This Period',
      value: `$${earnings.periodRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Payouts',
      value: `$${earnings.pendingPayouts.toFixed(2)}`,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Completed Payouts',
      value: `$${earnings.completedPayouts.toFixed(2)}`,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
        <p className="mt-1 text-sm text-gray-500">Earnings, payouts, and financial overview</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Management</h2>
        <p className="text-gray-600">Payout management features coming soon...</p>
      </div>
    </div>
  );
}

