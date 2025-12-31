'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Settings as SettingsIcon, Truck, DollarSign } from 'lucide-react';

interface Setting {
  _id: string;
  key: string;
  value: any;
  description: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      await api.patch(`/settings/${key}`, { value });
      fetchSettings();
      alert('Setting updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating setting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const freeDeliverySetting = settings.find(s => s.key === 'freeDeliveryEnabled');
  const freeDeliveryMessage = settings.find(s => s.key === 'freeDeliveryMessage');
  const deliveryBasePrice = settings.find(s => s.key === 'deliveryBasePrice');
  const deliveryPricePerKm = settings.find(s => s.key === 'deliveryPricePerKm');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage app-wide settings</p>
      </div>

      {/* Free Delivery Toggle */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <Truck className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Delivery Settings</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Free Delivery for All</p>
              <p className="text-sm text-gray-500">Enable free delivery promotion for all customers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={freeDeliverySetting?.value === true}
                onChange={(e) => handleUpdateSetting('freeDeliveryEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {freeDeliverySetting?.value === true && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Delivery Message
              </label>
              <input
                type="text"
                value={freeDeliveryMessage?.value || ''}
                onChange={(e) => handleUpdateSetting('freeDeliveryMessage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Free delivery on all orders!"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Delivery Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={deliveryBasePrice?.value || 5.00}
                onChange={(e) => handleUpdateSetting('deliveryBasePrice', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Kilometer ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={deliveryPricePerKm?.value || 1.50}
                onChange={(e) => handleUpdateSetting('deliveryPricePerKm', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

