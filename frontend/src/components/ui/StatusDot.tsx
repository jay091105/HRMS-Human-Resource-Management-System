import React from 'react';

interface StatusDotProps {
  status: string;
  label?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label }) => {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    terminated: 'bg-red-500',
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-orange-500',
    'half-day': 'bg-blue-500',
    paid: 'bg-green-500',
    processing: 'bg-yellow-500',
  };

  const color = statusColors[status] || 'bg-gray-500';

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      {label && <span className="text-sm text-gray-700 capitalize">{label || status}</span>}
    </div>
  );
};

