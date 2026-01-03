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
        {attendance.hoursWorked && (
          <p>
            <span className="font-medium">Hours Worked:</span> {attendance.hoursWorked} hrs
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

