'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Search, RefreshCw, CheckCircle, XCircle, Eye, Package } from 'lucide-react';

interface Delivery {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  driverId?: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    vehicleType: string;
    vehicleModel: string;
  };
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: string;
  price: number;
  distance: number;
  createdAt: string;
  assignedAt?: string;
}

const columnHelper = createColumnHelper<Delivery>();

function DeliveriesPageContent() {
  const searchParams = useSearchParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'reassign' | 'status' | 'dispute' | null>(null);
  const [formData, setFormData] = useState({ driverId: '', status: '', resolution: '', notes: '' });
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  const columns = [
    columnHelper.accessor('_id', {
      header: 'ID',
      cell: (info) => info.getValue().toString().slice(-8),
    }),
    columnHelper.accessor('userId.name', {
      header: 'Customer',
      cell: (info) => info.getValue() || 'N/A',
    }),
    columnHelper.accessor('driverId.userId.name', {
      header: 'Driver',
      cell: (info) => info.getValue() || 'Unassigned',
    }),
    columnHelper.accessor('pickupLocation.address', {
      header: 'Pickup',
      cell: (info) => (
        <span className="max-w-xs truncate block" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('dropoffLocation.address', {
      header: 'Dropoff',
      cell: (info) => (
        <span className="max-w-xs truncate block" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusConfig: Record<string, { bg: string; text: string }> = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          assigned: { bg: 'bg-blue-100', text: 'text-blue-800' },
          accepted: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
          'picked_up': { bg: 'bg-purple-100', text: 'text-purple-800' },
          'in-transit': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
          'in_transit': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
          delivered: { bg: 'bg-green-100', text: 'text-green-800' },
          cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
        };
        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} capitalize`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    columnHelper.accessor('distance', {
      header: 'Distance',
      cell: (info) => `${info.getValue().toFixed(1)} km`,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const delivery = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewDelivery(delivery)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(delivery, 'reassign')}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
              title="Reassign Driver"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(delivery, 'status')}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
              title="Update Status"
            >
              <Package className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(delivery, 'dispute')}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
              title="Resolve Dispute"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: deliveries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchDeliveries();
  }, [pagination.page, statusFilter, search]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/deliveries?${params}`);
      setDeliveries(response.data.deliveries);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const response = await api.get('/drivers?verificationStatus=approved');
      setAvailableDrivers(response.data.drivers.filter((d: any) => d.isAvailable));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleAction = async (delivery: Delivery, type: 'reassign' | 'status' | 'dispute') => {
    setSelectedDelivery(delivery);
    setModalType(type);
    setShowModal(true);
    setFormData({ driverId: '', status: delivery.status, resolution: '', notes: '' });
    
    if (type === 'reassign') {
      await fetchAvailableDrivers();
    }
  };

  const handleViewDelivery = (delivery: Delivery) => {
    window.location.href = `/dashboard/deliveries/${delivery._id}`;
  };

  const handleSubmitAction = async () => {
    if (!selectedDelivery || !modalType) return;

    try {
      let endpoint = '';
      let payload: any = {};

      switch (modalType) {
        case 'reassign':
          if (!formData.driverId) {
            alert('Please select a driver');
            return;
          }
          endpoint = `/deliveries/${selectedDelivery._id}/reassign`;
          payload.driverId = formData.driverId;
          break;
        case 'status':
          if (!formData.status) {
            alert('Please select a status');
            return;
          }
          endpoint = `/deliveries/${selectedDelivery._id}/status`;
          payload.status = formData.status;
          if (formData.notes) payload.notes = formData.notes;
          break;
        case 'dispute':
          if (!formData.resolution || !formData.notes) {
            alert('Resolution and notes are required');
            return;
          }
          endpoint = `/deliveries/${selectedDelivery._id}/resolve-dispute`;
          payload.resolution = formData.resolution;
          payload.notes = formData.notes;
          break;
      }

      await api.patch(endpoint, payload);
      setShowModal(false);
      setSelectedDelivery(null);
      setModalType(null);
      setFormData({ driverId: '', status: '', resolution: '', notes: '' });
      fetchDeliveries();
      alert('Action completed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error performing action');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Oversight</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and monitor all delivery requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="picked_up">Picked Up</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter('');
              setSearch('');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} deliveries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {modalType === 'reassign' && 'Reassign Driver'}
              {modalType === 'status' && 'Update Status'}
              {modalType === 'dispute' && 'Resolve Dispute'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Delivery ID: {selectedDelivery._id.toString().slice(-8)}
            </p>
            
            {modalType === 'reassign' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a driver...</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.userId?.name} - {driver.vehicleType} ({driver.vehicleModel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {modalType === 'status' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional notes..."
                />
              </div>
            )}

            {modalType === 'dispute' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select resolution...</option>
                    <option value="customer_favor">Resolved in Customer Favor</option>
                    <option value="driver_favor">Resolved in Driver Favor</option>
                    <option value="partial_refund">Partial Refund</option>
                    <option value="full_refund">Full Refund</option>
                    <option value="no_action">No Action Required</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (required)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter resolution notes..."
                    required
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleSubmitAction}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDelivery(null);
                  setModalType(null);
                  setFormData({ driverId: '', status: '', resolution: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <DeliveriesPageContent />
    </Suspense>
  );
}

