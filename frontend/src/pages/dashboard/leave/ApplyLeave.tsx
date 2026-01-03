import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveService } from '../../../services/leave.service';
import { employeeService } from '../../../services/employee.service';
import { LeaveForm } from '../../../components/forms/LeaveForm';
import { LeaveFormData } from '../../../types/leave';
import { Employee } from '../../../types/employee';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ProfileForm } from '../../../components/forms/ProfileForm';
import { useAuth } from '../../../hooks/useAuth';

export const ApplyLeave: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profile = await employeeService.getMyProfile();
        setEmployee(profile);
        setHasProfile(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasProfile(false);
        } else {
          setError('Failed to check profile');
        }
      }
    };
    checkProfile();
  }, []);

  const handleCreateProfile = async (data: Partial<Employee>) => {
    try {
      const profileData = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: user?.email || '',
        phone: data.phone || '',
        department: data.department || '',
        position: data.position || '',
        hireDate: data.hireDate || new Date().toISOString(),
        salary: data.salary || 0,
        address: data.address || '',
      };
      const created = await employeeService.createMyProfile(profileData);
      setEmployee(created);
      setHasProfile(true);
      setShowCreateModal(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
      throw err;
    }
  };

  const handleSubmit = async (data: LeaveFormData) => {
    if (!hasProfile) {
      setShowCreateModal(true);
      return;
    }
    try {
      await leaveService.createLeave(data);
      navigate('/dashboard/leave');
    } catch (err: any) {
      if (err.response?.status === 404 && err.response?.data?.message?.includes('Employee profile')) {
        setHasProfile(false);
        setShowCreateModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to submit leave request');
      }
    }
  };

  if (hasProfile === null) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Apply for Leave</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard/leave')}>
          Back to Leave Requests
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!hasProfile && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Employee Profile Required</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to create your employee profile before applying for leave. Click the button below to create your profile.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setShowCreateModal(true)}
              >
                Create Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {hasProfile ? (
          <LeaveForm onSubmit={handleSubmit} onCancel={() => navigate('/dashboard/leave')} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please create your employee profile first.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Employee Profile
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError('');
        }}
        title="Create Employee Profile"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <ProfileForm
          initialData={{
            email: user?.email || '',
          } as Employee}
          onSubmit={handleCreateProfile}
          onCancel={() => {
            setShowCreateModal(false);
            setError('');
          }}
        />
      </Modal>
    </div>
  );
};
