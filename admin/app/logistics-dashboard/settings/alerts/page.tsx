'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { Bell, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface AlertRule {
  _id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: {
    channels: string[];
    recipients: string[];
  };
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

export default function AlertRulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAlertRules();
  }, []);

  const fetchAlertRules = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/alert-rules');
      setAlertRules(response.data.alertRules || []);
    } catch (err: any) {
      console.error('Error fetching alert rules:', err);
      setError(err.response?.data?.message || 'Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    try {
      await logisticsApi.patch(`/logistics-companies/dashboard/alert-rules/${ruleId}`, {
        isActive: !currentStatus
      });
      fetchAlertRules();
    } catch (err: any) {
      console.error('Error toggling alert rule:', err);
      setError(err.response?.data?.message || 'Failed to update alert rule');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      await logisticsApi.delete(`/logistics-companies/dashboard/alert-rules/${ruleId}`);
      fetchAlertRules();
    } catch (err: any) {
      console.error('Error deleting alert rule:', err);
      setError(err.response?.data?.message || 'Failed to delete alert rule');
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      status_change: 'Status Change',
      delay: 'Delay',
      exception: 'Exception',
      eta_update: 'ETA Update',
      payment_received: 'Payment Received',
      custom: 'Custom'
    };
    return labels[trigger] || trigger;
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
          <h1 className="text-2xl font-bold text-gray-900">Alert Rules</h1>
          <p className="mt-1 text-sm text-gray-500">Configure custom alerts and notifications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Rule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {alertRules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alert Rules</h3>
          <p className="text-gray-600 mb-4">Create alert rules to get notified about important events</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {alertRules.map((rule) => (
            <div key={rule._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      {getTriggerLabel(rule.trigger)}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Channels:</span>
                      <span className="ml-2 text-gray-900">{rule.actions.channels.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recipients:</span>
                      <span className="ml-2 text-gray-900">{rule.actions.recipients.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Triggered:</span>
                      <span className="ml-2 text-gray-900">{rule.triggerCount} times</span>
                    </div>
                    {rule.lastTriggered && (
                      <div>
                        <span className="text-gray-500">Last Triggered:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(rule.lastTriggered).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(rule._id, rule.isActive)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



