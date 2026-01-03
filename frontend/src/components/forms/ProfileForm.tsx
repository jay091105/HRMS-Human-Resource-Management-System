import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Employee } from '../../types/employee';

interface ProfileFormProps {
  initialData?: Employee;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isReadOnly = false,
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    gender: '',
    maritalStatus: '',
    manager: '',
    location: '',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 0,
    ...initialData,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName || ''}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
          disabled={isReadOnly}
        />
        <Input
          label="Last Name"
          value={formData.lastName || ''}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
          disabled={isReadOnly}
        />
      </div>
      <Input
        type="email"
        label="Email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        disabled={isReadOnly}
      />
      <Input
        type="tel"
        label="Phone"
        value={formData.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
        disabled={isReadOnly}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Department"
          value={formData.department || ''}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
          disabled={isReadOnly}
        />
        <Input
          label="Position"
          value={formData.position || ''}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          required
          disabled={isReadOnly}
        />
      </div>
      {!initialData && (
        <Input
          type="number"
          label="Salary (Annual)"
          value={formData.salary || ''}
          onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
          required
          disabled={isReadOnly}
          placeholder="Enter annual salary"
        />
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isReadOnly}
        />
      </div>

      {/* Additional Information */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Joining
            </label>
            <Input
              type="date"
              value={formData.hireDate ? new Date(formData.hireDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              required
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isReadOnly}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status
            </label>
            <select
              value={formData.maritalStatus || ''}
              onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isReadOnly}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
          <Input
            label="Manager"
            value={formData.manager || ''}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="Location"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="Employee Code"
            value={formData.employeeId || ''}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            disabled={isReadOnly || !!initialData}
            placeholder="Auto-generated if not provided"
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Bank Account Number"
            value={formData.bankAccountNumber || ''}
            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="Bank Name"
            value={formData.bankName || ''}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            disabled={isReadOnly}
          />
          <Input
            label="IFSC Code"
            value={formData.ifscCode || ''}
            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
            disabled={isReadOnly}
            placeholder="e.g., SBIN0001234"
          />
          <Input
            label="PAN Number"
            value={formData.panNumber || ''}
            onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            disabled={isReadOnly}
            placeholder="e.g., ABCDE1234F"
          />
          <Input
            label="UAN Number"
            value={formData.uanNumber || ''}
            onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
            disabled={isReadOnly}
            placeholder="Universal Account Number"
          />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex gap-2">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Save
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  );
};

