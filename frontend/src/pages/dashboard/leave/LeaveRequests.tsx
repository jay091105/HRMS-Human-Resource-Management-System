import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../../hooks/useRole';
import { leaveService } from '../../../services/leave.service';
import { Leave } from '../../../types/leave';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { formatDate } from '../../../utils/formatDate';
import { Modal } from '../../../components/ui/Modal';
import { LEAVE_TYPES } from '../../../utils/constants';

export const LeaveRequests: React.FC = () => {
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setError('');
        const data = isAdmin
          ? await leaveService.getAllLeaves()
          : await leaveService.getMyLeaves();
        setLeaves(data);
        setFilteredLeaves(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load leave requests');
        console.error('Error fetching leaves:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [isAdmin]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(leaves.filter(l => l.status === statusFilter));
    }
  }, [statusFilter, leaves]);

  const handleApprove = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      await leaveService.updateLeaveStatus(id, 'approved', comments);
      setSuccess('Leave request approved successfully!');
      setShowModal(false);
      setComments('');
      const data = isAdmin
        ? await leaveService.getAllLeaves()
        : await leaveService.getMyLeaves();
      setLeaves(data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      await leaveService.updateLeaveStatus(id, 'rejected', comments);
      setSuccess('Leave request rejected.');
      setShowModal(false);
      setComments('');
      const data = isAdmin
        ? await leaveService.getAllLeaves()
        : await leaveService.getMyLeaves();
      setLeaves(data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject leave request');
    }
  };

  const openModal = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
    setComments('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Review and manage employee leave requests' : 'View and track your leave applications'}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => navigate('/dashboard/leave/apply')}>
            + Apply for Leave
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600 uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600 uppercase">Approved</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{approvedCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-600 uppercase">Rejected</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{rejectedCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600 uppercase">Total</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{leaves.length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'pending' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'approved' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </Button>
        </div>
      </div>

      {filteredLeaves.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {LEAVE_TYPES.find(t => t.value === leave.type)?.label || leave.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(leave.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {leave.days} {leave.days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusDot status={leave.status} />
                  </td>
                  {isAdmin && leave.status === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openModal(leave)}
                      >
                        Review
                      </Button>
                    </td>
                  )}
                  {isAdmin && leave.status !== 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {leave.comments && (
                        <span className="text-xs" title={leave.comments}>
                          {leave.comments.substring(0, 30)}...
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} leave requests found`
              : 'No leave requests found'}
          </p>
          {!isAdmin && statusFilter === 'all' && (
            <Button className="mt-4" onClick={() => navigate('/dashboard/leave/apply')}>
              Apply for Leave
            </Button>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setComments('');
        }}
        title="Review Leave Request"
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Leave Type:</span>
                <p className="text-sm text-gray-900 capitalize mt-1">
                  {LEAVE_TYPES.find(t => t.value === selectedLeave.type)?.label || selectedLeave.type}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Date Range:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Duration:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedLeave.days} {selectedLeave.days === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Reason:</span>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selectedLeave.reason}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any comments or notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedLeave._id!)}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(selectedLeave._id!)}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
