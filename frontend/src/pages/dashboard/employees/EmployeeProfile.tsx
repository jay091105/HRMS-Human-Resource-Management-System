import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../../../services/employee.service';
import { Employee } from '../../../types/employee';
import { ProfileForm } from '../../../components/forms/ProfileForm';
import { Button } from '../../../components/ui/Button';
import { StatusDot } from '../../../components/ui/StatusDot';
import { formatDate } from '../../../utils/formatDate';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const data = await employeeService.getEmployeeById(id);
        setEmployee(data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleUpdate = async (data: Partial<Employee>) => {
    if (!id) return;
    try {
      const updated = await employeeService.updateEmployee(id, data);
      setEmployee(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!employee) {
    return <div className="p-8">Employee not found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/dashboard/employees')}>
            Back
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {isEditing ? (
          <ProfileForm
            initialData={employee}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {employee.firstName} {employee.lastName}
              </h2>
              <StatusDot status={employee.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Employee ID:</span>
                <p className="text-gray-900">{employee.employeeId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{employee.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone:</span>
                <p className="text-gray-900">{employee.phone}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Department:</span>
                <p className="text-gray-900">{employee.department}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Position:</span>
                <p className="text-gray-900">{employee.position}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Hire Date:</span>
                <p className="text-gray-900">{formatDate(employee.hireDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Salary:</span>
                <p className="text-gray-900">${employee.salary.toLocaleString()}</p>
              </div>
              {employee.address && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="text-gray-900">{employee.address}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

