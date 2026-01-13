'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { Users, Truck, Package, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

interface Driver {
  _id: string;
  userId: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  vehicleType: string;
  vehicleModel: string;
  vehiclePlate: string;
  isAvailable: boolean;
  isAssignedToCompany?: boolean;
  verificationStatus?: string;
  totalDeliveries?: number;
  rating?: number;
}

export default function LogisticsDriversPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    fetchDrivers();
  }, [filterAvailable]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterAvailable !== undefined) params.append('isAvailable', filterAvailable.toString());

      const response = await logisticsApi.get(`/logistics-companies/dashboard/drivers?${params.toString()}`);
      setDrivers(response.data.drivers || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDrivers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage your drivers</p>
      </div>

      {drivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Drivers Yet</h3>
          <p className="text-gray-600">Drivers associated with your company will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.userId.name}</div>
                        <div className="text-sm text-gray-500">{driver.userId.email}</div>
                        <div className="text-sm text-gray-500">{driver.userId.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <Truck className="h-4 w-4 inline mr-1" />
                        {driver.vehicleType} - {driver.vehicleModel}
                      </div>
                      <div className="text-sm text-gray-500">{driver.vehiclePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.isAvailable ? (
                        <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Package className="h-4 w-4 inline mr-1" />
                      {driver.totalDeliveries || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.rating ? `${driver.rating.toFixed(1)} ⭐` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

