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

