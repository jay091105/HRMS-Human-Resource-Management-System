import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { employeeService } from '../../services/employee.service';
import { attendanceService } from '../../services/attendance.service';
import { leaveService } from '../../services/leave.service';
import { Attendance } from '../../types/attendance';
import { Leave } from '../../types/leave';
import { formatDate, formatTime } from '../../utils/formatDate';
import { StatusDot } from '../../components/ui/StatusDot';
import { Button } from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    activeEmployees: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        if (isAdmin) {
          const [employees, attendance, leaves] = await Promise.all([
            employeeService.getAllEmployees(),
            attendanceService.getAllAttendance(),
            leaveService.getAllLeaves('pending'),
          ]);
          
          const today = new Date().toISOString().split('T')[0];
          const todayAtt = attendance.filter(
            (a) => a.date.split('T')[0] === today
          );

          setStats({
            totalEmployees: employees.length,
            todayAttendance: todayAtt.length,
            pendingLeaves: leaves.length,
            activeEmployees: employees.filter(e => e.status === 'active').length,
          });
          setRecentAttendance(attendance.slice(0, 5));
          setRecentLeaves(leaves.slice(0, 5));
        } else {
          const [attendance, leaves] = await Promise.all([
            attendanceService.getMyAttendance(),
            leaveService.getMyLeaves(),
          ]);
          
          setRecentAttendance(attendance.slice(0, 5));
          setRecentLeaves(leaves.filter((l) => l.status === 'pending').slice(0, 5));
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your HRMS.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Attendance</h2>
            <button
              onClick={() => navigate('/dashboard/attendance')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          {recentAttendance.length > 0 ? (
            <div className="space-y-3">
              {recentAttendance.map((att) => (
                <div key={att._id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(att.date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {att.checkIn && `Check-in: ${formatTime(att.checkIn)}`}
                        {att.checkOut && ` • Check-out: ${formatTime(att.checkOut)}`}
                        {att.hoursWorked && ` • ${att.hoursWorked} hrs`}
                      </p>
                    </div>
                    <StatusDot status={att.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No attendance records</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h2>
            <button
              onClick={() => navigate('/dashboard/leave')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          {recentLeaves.length > 0 ? (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {leave.type} Leave
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.days} days)
                      </p>
                    </div>
                    <StatusDot status={leave.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No leave requests</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase">Present Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayAttendance}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase">On Leave</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/attendance')}
              className="w-full"
            >
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/leave')}
              className="w-full"
            >
              Apply Leave
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/payroll')}
              className="w-full"
            >
              View Payslip
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/profile')}
              className="w-full"
            >
              Update Profile
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
