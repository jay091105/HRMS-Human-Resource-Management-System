import React from 'react';
import { Employee } from '../../types/employee';
import { StatusDot } from '../ui/StatusDot';
import { formatDate } from '../../utils/formatDate';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm text-gray-500">{employee.employeeId}</p>
        </div>
        <StatusDot status={employee.status} />
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Position:</span> {employee.position}
        </p>
        <p>
          <span className="font-medium">Department:</span> {employee.department}
        </p>
        <p>
          <span className="font-medium">Email:</span> {employee.email}
        </p>
        <p>
          <span className="font-medium">Hire Date:</span> {formatDate(employee.hireDate)}
        </p>
      </div>
    </div>
  );
};

