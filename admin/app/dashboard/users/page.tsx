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
import { Search, Ban, Unlock, LogOut, Eye } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'driver';
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt: string;
  lastActivity?: string;
}

const columnHelper = createColumnHelper<User>();

function UsersPageContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [suspendedFilter, setSuspendedFilter] = useState(searchParams.get('isSuspended') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() === 'driver' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('isSuspended', {
      header: 'Status',
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {info.getValue() ? 'Suspended' : 'Active'}
        </span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Joined',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewUser(info.row.original._id)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleSuspendToggle(info.row.original)}
            className={`p-1 rounded ${
              info.row.original.isSuspended
                ? 'text-green-600 hover:bg-green-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={info.row.original.isSuspended ? 'Unsuspend' : 'Suspend'}
          >
            {info.row.original.isSuspended ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => handleForceLogout(info.row.original._id)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="Force Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, suspendedFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (roleFilter) params.append('role', roleFilter);
      if (suspendedFilter) params.append('isSuspended', suspendedFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendToggle = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.isSuspended ? 'unsuspend' : 'suspend'} this user?`)) {
      return;
    }

    try {
      const reason = user.isSuspended ? null : prompt('Reason for suspension:');
      await api.patch(`/users/${user._id}/suspend`, { reason });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating user');
    }
  };

  const handleForceLogout = async (userId: string) => {
    if (!confirm('Are you sure you want to force logout this user?')) {
      return;
    }

    try {
      await api.post(`/users/${userId}/force-logout`);
      alert('User will be logged out on next token validation');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error forcing logout');
    }
  };

  const handleViewUser = async (userId: string) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setSelectedUser(response.data);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      alert(error.response?.data?.message || 'Error loading user details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all users and their accounts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="driver">Driver</option>
          </select>
          <select
            value={suspendedFilter}
            onChange={(e) => setSuspendedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
          <button
            onClick={() => {
              setRoleFilter('');
              setSuspendedFilter('');
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
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
              ) : selectedUser ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-sm text-gray-900">{selectedUser.user?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{selectedUser.user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-sm text-gray-900">{selectedUser.user?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.user?.role === 'driver' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.user?.role || 'user'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.user?.isSuspended ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.user?.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.user?.createdAt ? new Date(selectedUser.user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedUser.user?.suspensionReason && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Reason</label>
                        <p className="text-sm text-gray-900">{selectedUser.user.suspensionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Driver Profile */}
                  {selectedUser.driverProfile && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Profile</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                          <p className="text-sm text-gray-900">{selectedUser.driverProfile.licenseNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedUser.driverProfile.vehicleType || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                          <p className="text-sm text-gray-900">{selectedUser.driverProfile.vehicleModel || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Plate</label>
                          <p className="text-sm text-gray-900">{selectedUser.driverProfile.vehiclePlate || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                          <p className="text-sm text-gray-900">{selectedUser.driverProfile.rating || 0} / 5</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Deliveries</label>
                          <p className="text-sm text-gray-900">{selectedUser.driverProfile.totalDeliveries || 0}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            selectedUser.driverProfile.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedUser.driverProfile.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            selectedUser.driverProfile.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedUser.driverProfile.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedUser.driverProfile.verificationStatus || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  );
}

