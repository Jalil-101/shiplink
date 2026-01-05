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
  const [fullApplicationDetails, setFullApplicationDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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
              onClick={async () => {
                setSelectedApplication(application);
                setShowDetailsModal(true);
                setLoadingDetails(true);
                const details = await fetchApplicationDetails(application.userId, application.role);
                setFullApplicationDetails(details);
                setLoadingDetails(false);
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

  const fetchApplicationDetails = async (userId: string, role: string) => {
    try {
      const response = await api.get(`/role-applications/${userId}/${role}`);
      return response.data.application;
    } catch (error) {
      console.error('Error fetching application details:', error);
      return null;
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
                <h4 className="font-semibold text-gray-900 mb-2 text-base">License Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">License Number:</span> <span className="text-gray-900">{profile.licenseNumber || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Expiry:</span> <span className="text-gray-900">{profile.licenseExpiry || 'N/A'}</span></p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Vehicle Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">Type:</span> <span className="text-gray-900 capitalize">{profile.vehicleType || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Model:</span> <span className="text-gray-900">{profile.vehicleModel || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Plate:</span> <span className="text-gray-900">{profile.vehiclePlate || 'N/A'}</span></p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Documents</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                {profile.documents?.governmentId && Array.isArray(profile.documents.governmentId) && profile.documents.governmentId.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Government ID:</span>
                    <span className="text-sm text-gray-900">{profile.documents.governmentId.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.driversLicense && Array.isArray(profile.documents.driversLicense) && profile.documents.driversLicense.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Driver's License:</span>
                    <span className="text-sm text-gray-900">{profile.documents.driversLicense.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.vehicleRegistration && Array.isArray(profile.documents.vehicleRegistration) && profile.documents.vehicleRegistration.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Vehicle Registration:</span>
                    <span className="text-sm text-gray-900">{profile.documents.vehicleRegistration.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.insuranceDocument && Array.isArray(profile.documents.insuranceDocument) && profile.documents.insuranceDocument.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Insurance:</span>
                    <span className="text-sm text-gray-900">{profile.documents.insuranceDocument.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.selfie && Array.isArray(profile.documents.selfie) && profile.documents.selfie.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Selfie:</span>
                    <span className="text-sm text-gray-900">{profile.documents.selfie.length} file(s)</span>
                  </div>
                )}
                {profile.idDocument && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">ID Document:</span>
                    <span className="text-sm text-gray-900">1 file</span>
                  </div>
                )}
                {(!profile.documents || (Object.keys(profile.documents || {}).length === 0 && !profile.idDocument)) && (
                  <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'seller':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Business Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">Business Name:</span> <span className="text-gray-900">{profile.businessName || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Type:</span> <span className="text-gray-900 capitalize">{profile.businessType || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Tax ID:</span> <span className="text-gray-900">{profile.taxId || 'N/A'}</span></p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Bank Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">Account Number:</span> <span className="text-gray-900">{profile.bankAccountNumber || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Bank Name:</span> <span className="text-gray-900">{profile.bankName || 'N/A'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-gray-700">Account Holder:</span> <span className="text-gray-900">{profile.accountHolderName || 'N/A'}</span></p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Documents</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                {profile.documents?.businessRegistration && Array.isArray(profile.documents.businessRegistration) && profile.documents.businessRegistration.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Business Registration:</span>
                    <span className="text-sm text-gray-900">{profile.documents.businessRegistration.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.proofOfStock && Array.isArray(profile.documents.proofOfStock) && profile.documents.proofOfStock.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Proof of Stock:</span>
                    <span className="text-sm text-gray-900">{profile.documents.proofOfStock.length} file(s)</span>
                  </div>
                )}
                {profile.businessLicense && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Business License:</span>
                    <span className="text-sm text-gray-900">1 file</span>
                  </div>
                )}
                {(!profile.documents || (Object.keys(profile.documents || {}).length === 0 && !profile.businessLicense)) && (
                  <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'sourcing-agent':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Specializations</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {profile.specialization && Array.isArray(profile.specialization) && profile.specialization.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.specialization.map((spec: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No specializations listed</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Experience</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">Years:</span> <span className="text-gray-900">{profile.experience || 'N/A'}</span></p>
                  {profile.bio && (
                    <p className="text-sm"><span className="font-semibold text-gray-700">Bio:</span> <span className="text-gray-900">{profile.bio}</span></p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Documents</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                {profile.documents?.businessLicense && Array.isArray(profile.documents.businessLicense) && profile.documents.businessLicense.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Business License:</span>
                    <span className="text-sm text-gray-900">{profile.documents.businessLicense.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.certifications && Array.isArray(profile.documents.certifications) && profile.documents.certifications.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Certifications:</span>
                    <span className="text-sm text-gray-900">{profile.documents.certifications.length} file(s)</span>
                  </div>
                )}
                {(!profile.documents || Object.keys(profile.documents || {}).length === 0) && (
                  <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'import-coach':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Expertise Areas</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {profile.expertise && Array.isArray(profile.expertise) && profile.expertise.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((area: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No expertise areas listed</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Experience & Qualifications</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  {profile.bio && (
                    <p className="text-sm"><span className="font-semibold text-gray-700">Bio:</span> <span className="text-gray-900">{profile.bio}</span></p>
                  )}
                  {profile.qualifications && Array.isArray(profile.qualifications) && profile.qualifications.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Qualifications:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {profile.qualifications.map((qual: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-900">{qual}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-base">Documents</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                {profile.documents?.certifications && Array.isArray(profile.documents.certifications) && profile.documents.certifications.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Certifications:</span>
                    <span className="text-sm text-gray-900">{profile.documents.certifications.length} file(s)</span>
                  </div>
                )}
                {profile.documents?.businessLicense && Array.isArray(profile.documents.businessLicense) && profile.documents.businessLicense.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Business License:</span>
                    <span className="text-sm text-gray-900">{profile.documents.businessLicense.length} file(s)</span>
                  </div>
                )}
                {(!profile.documents || Object.keys(profile.documents || {}).length === 0) && (
                  <p className="text-sm text-gray-500 italic">No documents uploaded</p>
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
                  setFullApplicationDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-base">Applicant Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-semibold text-gray-700">Name:</span> <span className="text-gray-900">{selectedApplication.userName || 'N/A'}</span></p>
                      <p className="text-sm"><span className="font-semibold text-gray-700">Email:</span> <span className="text-gray-900">{selectedApplication.userEmail || 'N/A'}</span></p>
                      <p className="text-sm"><span className="font-semibold text-gray-700">Phone:</span> <span className="text-gray-900">{selectedApplication.userPhone || 'N/A'}</span></p>
                      <p className="text-sm"><span className="font-semibold text-gray-700">Role Applied:</span> <span className="text-gray-900">{roleLabels[selectedApplication.role] || selectedApplication.role}</span></p>
                      <p className="text-sm"><span className="font-semibold text-gray-700">Requested:</span> <span className="text-gray-900">{selectedApplication.requestedAt ? new Date(selectedApplication.requestedAt).toLocaleString() : 'N/A'}</span></p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-base">Application Details</h4>
                  {fullApplicationDetails?.profile ? (
                    renderProfileDetails(fullApplicationDetails.profile, selectedApplication.role)
                  ) : selectedApplication.profile ? (
                    renderProfileDetails(selectedApplication.profile, selectedApplication.role)
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">No profile data available for this application.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setFullApplicationDetails(null);
                  handleAction(selectedApplication, 'approve');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setFullApplicationDetails(null);
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

