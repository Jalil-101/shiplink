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
import { Search, CheckCircle, XCircle, Ban, Eye, Users } from 'lucide-react';

interface SourcingAgent {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  agentName: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  totalRequests: number;
  createdAt: string;
}

const columnHelper = createColumnHelper<SourcingAgent>();

function SourcingAgentsPageContent() {
  const searchParams = useSearchParams();
  const [agents, setAgents] = useState<SourcingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedAgent, setSelectedAgent] = useState<SourcingAgent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [notes, setNotes] = useState('');

  const columns = [
    columnHelper.accessor('agentName', {
      header: 'Agent Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('userId.email', {
      header: 'Email',
      cell: (info) => info.getValue() || 'N/A',
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
    columnHelper.accessor('totalRequests', {
      header: 'Requests',
      cell: (info) => info.getValue() || 0,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const agent = info.row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = `/dashboard/sourcing-agents/${agent._id}`}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Eye className="h-4 w-4" />
            </button>
            {agent.verificationStatus === 'pending' && (
              <>
                <button
                  onClick={() => handleAction(agent, 'approve')}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction(agent, 'reject')}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleAction(agent, 'suspend')}
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
    data: agents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.pages,
  });

  useEffect(() => {
    fetchAgents();
  }, [pagination.page, statusFilter, search]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('verificationStatus', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/sourcing-agents?${params}`);
      setAgents(response.data.agents);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (agent: SourcingAgent, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedAgent(agent);
    setActionType(action);
    setShowModal(true);
    setNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedAgent || !actionType) return;

    if ((actionType === 'reject' || actionType === 'suspend') && !notes.trim()) {
      alert('Notes are required for this action');
      return;
    }

    try {
      let endpoint = '';
      let payload: any = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/sourcing-agents/${selectedAgent._id}/approve`;
          if (notes) payload.notes = notes;
          break;
        case 'reject':
          endpoint = `/sourcing-agents/${selectedAgent._id}/reject`;
          payload.notes = notes;
          break;
        case 'suspend':
          endpoint = `/sourcing-agents/${selectedAgent._id}/suspend`;
          payload.reason = notes;
          break;
      }

      await api.patch(endpoint, payload);
      setShowModal(false);
      setSelectedAgent(null);
      setActionType(null);
      setNotes('');
      fetchAgents();
      alert('Action completed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error performing action');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sourcing Agents</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and verify sourcing agents</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} agents
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

      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Agent'}
              {actionType === 'reject' && 'Reject Agent'}
              {actionType === 'suspend' && 'Suspend Agent'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Agent: {selectedAgent.agentName}
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
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAgent(null);
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

export default function SourcingAgentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SourcingAgentsPageContent />
    </Suspense>
  );
}



