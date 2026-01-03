import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ChangePasswordFormProps {
  onSubmit: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  onCancel: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
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
      <Input
        type="password"
        label="Current Password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        required
        placeholder="Enter current password"
      />
      <Input
        type="password"
        label="New Password"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
        required
        placeholder="Enter new password"
      />
      <Input
        type="password"
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        required
        placeholder="Confirm new password"
      />
      <div className="flex gap-3">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Change Password
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

