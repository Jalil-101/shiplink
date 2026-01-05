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
import { Search, CheckCircle, XCircle, Eye, User, Truck, ShoppingBag, Globe, GraduationCap } from 'lucide-react';

interface RoleApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  role: 'driver' | 'seller' | 'sourcing-agent' | 'import-coach';
  requestedAt: string;
  createdAt: string;
  profile: any;
}

const columnHelper = createColumnHelper<RoleApplication>();

const roleIcons: Record<string, any> = {
  driver: Truck,
  seller: ShoppingBag,
  'sourcing-agent': Globe,
  'import-coach': GraduationCap,
};

const roleLabels: Record<string, string> = {
  driver: 'Driver',
  seller: 'Seller',
  'sourcing-agent': 'Sourcing Agent',
  'import-coach': 'Import Coach',
};

function RoleApplicationsPageContent() {
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedApplication, setSelectedApplication] = useState<RoleApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const columns = [
    columnHelper.accessor('userName', {
      header: 'Applicant',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-sm text-gray-500">{info.row.original.userEmail}</div>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => {
        const role = info.getValue();
        const Icon = roleIcons[role] || User;
        return (
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{roleLabels[role] || role}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('requestedAt', {
      header: 'Requested',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const application = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedApplication(application);
                setShowDetailsModal(true);
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(application, 'approve')}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction(application, 'reject')}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, roleFilter, search]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/role-applications?${params}`);
      setApplications(response.data.applications || []);
      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (application: RoleApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setActionType(action);
    setShowActionModal(true);
    setNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedApplication || !actionType) return;

    if (actionType === 'reject' && !notes.trim()) {
      alert('Notes are required for rejection');
      return;
    }

    try {
      const endpoint = `/role-applications/${selectedApplication.userId}/${selectedApplication.role}/${actionType}`;
      const payload = actionType === 'reject' ? { notes } : notes ? { notes } : {};

      await api.patch(endpoint, payload);
      setShowActionModal(false);
      setSelectedApplication(null);
      setActionType(null);
      setNotes('');
      fetchApplications();
      alert(`Application ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      alert(error.response?.data?.message || `Error ${actionType === 'approve' ? 'approving' : 'rejecting'} application`);
    }
  };

  const renderProfileDetails = (profile: any, role: string) => {
    if (!profile) return <p className="text-gray-500">No profile data available</p>;

    switch (role) {
      case 'driver':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">License Information</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">License Number:</span> {profile.licenseNumber || 'N/A'}</p>
                <p><span className="font-medium">Expiry:</span> {profile.licenseExpiry || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Vehicle Information</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">Type:</span> {profile.vehicleType || 'N/A'}</p>
                <p><span className="font-medium">Model:</span> {profile.vehicleModel || 'N/A'}</p>
                <p><span className="font-medium">Plate:</span> {profile.vehiclePlate || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                {profile.governmentId && profile.governmentId.length > 0 && (
                  <p><span className="font-medium">Government ID:</span> {profile.governmentId.length} file(s)</p>
                )}
                {profile.driversLicense && profile.driversLicense.length > 0 && (
                  <p><span className="font-medium">Driver's License:</span> {profile.driversLicense.length} file(s)</p>
                )}
                {profile.vehicleRegistration && profile.vehicleRegistration.length > 0 && (
                  <p><span className="font-medium">Vehicle Registration:</span> {profile.vehicleRegistration.length} file(s)</p>
                )}
                {profile.insuranceDocument && profile.insuranceDocument.length > 0 && (
                  <p><span className="font-medium">Insurance:</span> {profile.insuranceDocument.length} file(s)</p>
                )}
                {profile.selfie && profile.selfie.length > 0 && (
                  <p><span className="font-medium">Selfie:</span> {profile.selfie.length} file(s)</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'seller':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">Business Name:</span> {profile.businessName || 'N/A'}</p>
                <p><span className="font-medium">Type:</span> {profile.businessType || 'N/A'}</p>
                <p><span className="font-medium">Tax ID:</span> {profile.taxId || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bank Information</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">Account Number:</span> {profile.bankAccountNumber || 'N/A'}</p>
                <p><span className="font-medium">Bank Name:</span> {profile.bankName || 'N/A'}</p>
                <p><span className="font-medium">Account Holder:</span> {profile.accountHolderName || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                {profile.businessRegistration && profile.businessRegistration.length > 0 && (
                  <p><span className="font-medium">Business Registration:</span> {profile.businessRegistration.length} file(s)</p>
                )}
                {profile.proofOfStock && profile.proofOfStock.length > 0 && (
                  <p><span className="font-medium">Proof of Stock:</span> {profile.proofOfStock.length} file(s)</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'sourcing-agent':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Specializations</h4>
              <div className="bg-gray-50 p-3 rounded">
                {profile.specializations && profile.specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specializations listed</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">Years:</span> {profile.yearsOfExperience || 'N/A'}</p>
                {profile.previousClients && (
                  <p><span className="font-medium">Previous Clients:</span> {profile.previousClients}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                {profile.businessLicense && profile.businessLicense.length > 0 && (
                  <p><span className="font-medium">Business License:</span> {profile.businessLicense.length} file(s)</p>
                )}
                {profile.certifications && profile.certifications.length > 0 && (
                  <p><span className="font-medium">Certifications:</span> {profile.certifications.length} file(s)</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'import-coach':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Expertise Areas</h4>
              <div className="bg-gray-50 p-3 rounded">
                {profile.expertiseAreas && profile.expertiseAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.expertiseAreas.map((area: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No expertise areas listed</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><span className="font-medium">Years:</span> {profile.yearsOfExperience || 'N/A'}</p>
                {profile.qualifications && (
                  <p><span className="font-medium">Qualifications:</span> {profile.qualifications}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                {profile.certifications && profile.certifications.length > 0 && (
                  <p><span className="font-medium">Certifications:</span> {profile.certifications.length} file(s)</p>
                )}
                {profile.businessLicense && profile.businessLicense.length > 0 && (
                  <p><span className="font-medium">Business License:</span> {profile.businessLicense.length} file(s)</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">Profile data structure not recognized</p>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Role Applications</h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage role applications from users</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applicants..."
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
            <option value="driver">Driver</option>
            <option value="seller">Seller</option>
            <option value="sourcing-agent">Sourcing Agent</option>
            <option value="import-coach">Import Coach</option>
          </select>
          <button
            onClick={() => {
              setRoleFilter('');
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
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

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Application Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Applicant Information</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><span className="font-medium">Name:</span> {selectedApplication.userName}</p>
                  <p><span className="font-medium">Email:</span> {selectedApplication.userEmail}</p>
                  <p><span className="font-medium">Phone:</span> {selectedApplication.userPhone}</p>
                  <p><span className="font-medium">Role Applied:</span> {roleLabels[selectedApplication.role]}</p>
                  <p><span className="font-medium">Requested:</span> {new Date(selectedApplication.requestedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Application Details</h4>
                {renderProfileDetails(selectedApplication.profile, selectedApplication.role)}
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAction(selectedApplication, 'approve');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAction(selectedApplication, 'reject');
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Applicant: {selectedApplication.userName} ({roleLabels[selectedApplication.role]})
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
                placeholder={actionType === 'approve' ? 'Optional notes...' : 'Enter rejection reason...'}
                required={actionType === 'reject'}
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
                  setShowActionModal(false);
                  setSelectedApplication(null);
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

export default function RoleApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <RoleApplicationsPageContent />
    </Suspense>
  );
}

