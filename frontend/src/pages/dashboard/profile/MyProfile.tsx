import React, { useEffect, useState } from 'react';
import { employeeService } from '../../../services/employee.service';
import { Employee } from '../../../types/employee';
import { ProfileForm } from '../../../components/forms/ProfileForm';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/formatDate';
import { StatusDot } from '../../../components/ui/StatusDot';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await employeeService.getMyProfile();
        setEmployee(data);
        setError('');
      } catch (err: any) {
        if (err.response?.status === 404) {
          setEmployee(null);
          setError('');
        } else {
          setError('Failed to load profile');
          console.error('Error fetching profile:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
      setShowCreateModal(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile');
      throw err;
    }
  };

  const handleUpdate = async (data: Partial<Employee>) => {
    try {
      const updated = await employeeService.updateMyProfile(data);
      setEmployee(updated);
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                You need to create your employee profile to access all features.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create My Profile
            </Button>
          </div>
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
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
        {isEditing ? (
          <ProfileForm
            initialData={employee}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditing(false);
              setError('');
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-gray-500 mt-1">{employee.email}</p>
              </div>
              <StatusDot status={employee.status} label={employee.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Employee ID</span>
                  <p className="text-lg text-gray-900 font-semibold">{employee.employeeId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Phone</span>
                  <p className="text-lg text-gray-900">{employee.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Department</span>
                  <p className="text-lg text-gray-900">{employee.department}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Position</span>
                  <p className="text-lg text-gray-900">{employee.position}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Hire Date</span>
                  <p className="text-lg text-gray-900">{formatDate(employee.hireDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Salary</span>
                  <p className="text-lg text-gray-900">${employee.salary.toLocaleString()}/year</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Status</span>
                  <div className="mt-1">
                    <StatusDot status={employee.status} label={employee.status} />
                  </div>
                </div>
                {employee.address && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase">Address</span>
                    <p className="text-lg text-gray-900">{employee.address}</p>
                  </div>
                )}
              </div>
            </div>

            {employee.emergencyContact && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <p className="text-gray-900">{employee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <p className="text-gray-900">{employee.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Relationship</span>
                    <p className="text-gray-900">{employee.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
