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
import { Search, CheckCircle, XCircle, AlertCircle, Ban, Eye } from 'lucide-react';

interface Driver {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    isSuspended?: boolean;
  };
  licenseNumber: string;
  vehicleType: string;
  vehicleModel: string;
  vehiclePlate: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'needs-reupload';
  verificationNotes?: string;
  idDocument?: string;
  rating: number;
  totalDeliveries: number;
  isAvailable: boolean;
  createdAt: string;
}

const columnHelper = createColumnHelper<Driver>();

function DriversPageContent() {
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'reupload' | 'suspend' | null>(null);
  const [notes, setNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const columns = [
    columnHelper.accessor('userId.name', {
      header: 'Driver Name',
      cell: (info) => info.getValue() || 'N/A',
    }),
    columnHelper.accessor('userId.email', {
      header: 'Email',
      cell: (info) => info.getValue() || 'N/A',
    }),
    columnHelper.accessor('licenseNumber', {
      header: 'License',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('vehicleType', {
      header: 'Vehicle',
      cell: (info) => (
        <span className="capitalize">{info.getValue()} - {info.row.original.vehicleModel}</span>
      ),
    }),
    columnHelper.accessor('verificationStatus', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusConfig = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
          approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
          rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
          'needs-reupload': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Needs Reupload' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: (info) => (
        <span className="text-sm font-medium">{info.getValue().toFixed(1)} ⭐</span>
      ),
    }),
    columnHelper.accessor('totalDeliveries', {
      header: 'Deliveries',
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const driver = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewDriver(driver)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {driver.verificationStatus === 'pending' && (
              <>
                <button
                  onClick={() => handleAction(driver, 'approve')}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction(driver, 'reject')}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction(driver, 'reupload')}
                  className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                  title="Request Reupload"
                >
                  <AlertCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {driver.verificationStatus === 'needs-reupload' && (
              <button
                onClick={() => handleAction(driver, 'reupload')}
                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                title="Request Reupload"
              >
                <AlertCircle className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleAction(driver, 'suspend')}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Suspend Driver"
            >
              <Ban className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: drivers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchDrivers();
  }, [pagination.page, statusFilter, search]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('verificationStatus', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/drivers?${params}`);
      setDrivers(response.data.drivers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (driver: Driver, action: 'approve' | 'reject' | 'reupload' | 'suspend') => {
    setSelectedDriver(driver);
    setActionType(action);
    setShowModal(true);
    setNotes('');
  };

  const handleViewDriver = async (driver: Driver) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const response = await api.get(`/drivers/${driver._id}`);
      setDriverDetails(response.data);
    } catch (error: any) {
      console.error('Error fetching driver details:', error);
      alert(error.response?.data?.message || 'Error loading driver details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmitAction = async () => {
    if (!selectedDriver || !actionType) return;

    if ((actionType === 'reject' || actionType === 'reupload' || actionType === 'suspend') && !notes.trim()) {
      alert('Notes are required for this action');
      return;
    }

    try {
      let endpoint = '';
      let payload: any = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/drivers/${selectedDriver._id}/approve`;
          if (notes) payload.notes = notes;
          break;
        case 'reject':
          endpoint = `/drivers/${selectedDriver._id}/reject`;
          payload.notes = notes;
          break;
        case 'reupload':
          endpoint = `/drivers/${selectedDriver._id}/request-reupload`;
          payload.notes = notes;
          break;
        case 'suspend':
          endpoint = `/drivers/${selectedDriver._id}/suspend`;
          payload.reason = notes;
          break;
      }

      await api.patch(endpoint, payload);
      setShowModal(false);
      setSelectedDriver(null);
      setActionType(null);
      setNotes('');
      fetchDrivers();
      alert('Action completed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error performing action');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Verification</h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage driver verifications</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs-reupload">Needs Reupload</option>
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} drivers
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
      {showModal && selectedDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Driver'}
              {actionType === 'reject' && 'Reject Driver'}
              {actionType === 'reupload' && 'Request Reupload'}
              {actionType === 'suspend' && 'Suspend Driver'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Driver: {selectedDriver.userId?.name || 'N/A'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Notes (optional)' : 'Notes (required)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={actionType === 'approve' ? 'Optional notes...' : 'Enter notes...'}
                required={actionType !== 'approve'}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmitAction}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionType === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDriver(null);
                  setActionType(null);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Driver Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDriverDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : driverDetails?.driver ? (
                <div className="space-y-6">
                  {/* User Information */}
                  {driverDetails.driver.userId && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900">
                            {typeof driverDetails.driver.userId === 'object' 
                              ? driverDetails.driver.userId.name 
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-900">
                            {typeof driverDetails.driver.userId === 'object' 
                              ? driverDetails.driver.userId.email 
                              : 'N/A'}
                          </p>
                        </div>
                        {typeof driverDetails.driver.userId === 'object' && driverDetails.driver.userId.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <p className="text-sm text-gray-900">{driverDetails.driver.userId.phone}</p>
                          </div>
                        )}
                        {typeof driverDetails.driver.userId === 'object' && driverDetails.driver.userId.isSuspended !== undefined && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              driverDetails.driver.userId.isSuspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {driverDetails.driver.userId.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Driver Profile */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.licenseNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                        <p className="text-sm text-gray-900 capitalize">{driverDetails.driver.vehicleType || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.vehicleModel || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Plate</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.vehiclePlate || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.rating?.toFixed(1) || 0} / 5 ⭐</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Deliveries</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.totalDeliveries || 0}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          driverDetails.driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {driverDetails.driver.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          driverDetails.driver.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          driverDetails.driver.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          driverDetails.driver.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {driverDetails.driver.verificationStatus || 'N/A'}
                        </span>
                      </div>
                      {driverDetails.driver.createdAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                          <p className="text-sm text-gray-900">
                            {new Date(driverDetails.driver.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {driverDetails.driver.verificationNotes && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Notes</label>
                        <p className="text-sm text-gray-900">{driverDetails.driver.verificationNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriversPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <DriversPageContent />
    </Suspense>
  );
}

