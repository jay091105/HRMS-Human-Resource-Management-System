import React from 'react';
import { Attendance } from '../../types/attendance';
import { StatusDot } from '../ui/StatusDot';
import { formatDate, formatTime } from '../../utils/formatDate';

interface AttendanceCardProps {
  attendance: Attendance;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ attendance }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {formatDate(attendance.date)}
          </h3>
        </div>
        <StatusDot status={attendance.status} />
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Check In:</span> {formatTime(attendance.checkIn)}
        </p>
        {attendance.checkOut && (
          <p>
            <span className="font-medium">Check Out:</span> {formatTime(attendance.checkOut)}
          </p>
        )}
        {attendance.hoursWorked && attendance.checkOut && (
          <p>
            <span className="font-medium">Hours Worked:</span>{' '}
            {(() => {
              const hours = Math.floor(attendance.hoursWorked);
              const minutes = Math.round((attendance.hoursWorked % 1) * 60);
              if (hours > 0 && minutes > 0) {
                return `${hours}h ${minutes}m`;
              } else if (hours > 0) {
                return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
              } else if (minutes > 0) {
                return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
              }
              return '0 hours';
            })()}
          </p>
        )}
        {attendance.notes && (
          <p>
            <span className="font-medium">Notes:</span> {attendance.notes}
          </p>
        )}
      </div>
    </div>
  );
};

