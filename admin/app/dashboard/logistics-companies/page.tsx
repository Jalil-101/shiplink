'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Search, CheckCircle, XCircle, Ban, Eye, Truck, Plus } from 'lucide-react';

interface LogisticsCompany {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  companyName: string;
  registrationNumber: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  totalShipments: number;
  createdAt: string;
}

const columnHelper = createColumnHelper<LogisticsCompany>();

function LogisticsCompaniesPageContent() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<LogisticsCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedCompany, setSelectedCompany] = useState<LogisticsCompany | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [notes, setNotes] = useState('');
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    registrationNumber: '',
    businessLicense: '',
    logo: '',
    description: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');

  const columns = [
    columnHelper.accessor('companyName', {
      header: 'Company Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('registrationNumber', {
      header: 'Registration',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('verificationStatus', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
          pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
          approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
          rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
          suspended: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspended' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    }),
    columnHelper.accessor('totalShipments', {
      header: 'Shipments',
      cell: (info) => info.getValue() || 0,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const company = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = `/dashboard/logistics-companies/${company._id}`}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Eye className="h-4 w-4" />
            </button>
            {company.verificationStatus === 'pending' && (
              <>
                <button
                  onClick={() => handleAction(company, 'approve')}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction(company, 'reject')}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleAction(company, 'suspend')}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Ban className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, statusFilter, search]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('verificationStatus', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/logistics-companies?${params}`);
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (company: LogisticsCompany, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedCompany(company);
    setActionType(action);
    setShowModal(true);
    setNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedCompany || !actionType) return;

    if ((actionType === 'reject' || actionType === 'suspend') && !notes.trim()) {
      alert('Notes are required for this action');
      return;
    }

    try {
      let endpoint = '';
      let payload: any = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/logistics-companies/${selectedCompany._id}/approve`;
          if (notes) payload.notes = notes;
          break;
        case 'reject':
          endpoint = `/logistics-companies/${selectedCompany._id}/reject`;
          payload.notes = notes;
          break;
        case 'suspend':
          endpoint = `/logistics-companies/${selectedCompany._id}/suspend`;
          payload.reason = notes;
          break;
      }

      await api.patch(endpoint, payload);
      setShowModal(false);
      setSelectedCompany(null);
      setActionType(null);
      setNotes('');
      fetchCompanies();
      alert('Action completed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error performing action');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Companies</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and verify logistics companies</p>
        </div>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          <span>Enroll Company</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
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
            <option value="suspended">Suspended</option>
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
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} companies
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

      {/* Enroll Company Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Enroll New Logistics Company</h3>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollForm({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    companyName: '',
                    registrationNumber: '',
                    businessLicense: '',
                    logo: '',
                    description: '',
                  });
                  setLogoPreview('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    value={enrollForm.name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={enrollForm.password}
                    onChange={(e) => setEnrollForm({ ...enrollForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={enrollForm.companyName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    value={enrollForm.registrationNumber}
                    onChange={(e) => setEnrollForm({ ...enrollForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                <input
                  type="text"
                  value={enrollForm.businessLicense}
                  onChange={(e) => setEnrollForm({ ...enrollForm, businessLicense: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <div className="mt-2">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview('');
                          setEnrollForm({ ...enrollForm, logo: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              setLogoPreview(base64);
                              setEnrollForm({ ...enrollForm, logo: base64 });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={enrollForm.description}
                  onChange={(e) => setEnrollForm({ ...enrollForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={async () => {
                  if (!enrollForm.name || !enrollForm.email || !enrollForm.phone || !enrollForm.password || !enrollForm.companyName || !enrollForm.registrationNumber) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  try {
                    await api.post('/logistics-companies/enroll', enrollForm);
                    alert('Company enrolled successfully');
                    setShowEnrollModal(false);
                    setEnrollForm({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      companyName: '',
                      registrationNumber: '',
                      businessLicense: '',
                      logo: '',
                      description: '',
                    });
                    setLogoPreview('');
                    fetchCompanies();
                  } catch (error: any) {
                    alert(error.response?.data?.message || 'Error enrolling company');
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
              >
                Enroll Company
              </button>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollForm({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    companyName: '',
                    registrationNumber: '',
                    businessLicense: '',
                    logo: '',
                    description: '',
                  });
                  setLogoPreview('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Company'}
              {actionType === 'reject' && 'Reject Company'}
              {actionType === 'suspend' && 'Suspend Company'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Company: {selectedCompany.companyName}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Notes (optional)' : 'Notes (required)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
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
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCompany(null);
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
    </div>
  );
}

export default function LogisticsCompaniesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LogisticsCompaniesPageContent />
    </Suspense>
  );
}



