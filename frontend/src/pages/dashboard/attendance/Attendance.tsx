import React, { useEffect, useState } from 'react';
import { useRole } from '../../../hooks/useRole';
import { attendanceService } from '../../../services/attendance.service';
import { Attendance } from '../../../types/attendance';
import { Button } from '../../../components/ui/Button';
import { AdminAttendanceView } from './AdminAttendanceView';
import { MonthlyAttendanceView } from './MonthlyAttendanceView';
import { formatTime, getDateString } from '../../../utils/formatDate';
import { employeeService } from '../../../services/employee.service';
import { Employee } from '../../../types/employee';

export const AttendancePage: React.FC = () => {
  const { isAdmin } = useRole();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMonthlyView, setShowMonthlyView] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError('');
        // Get employee profile to get employee ID
        const empData = await employeeService.getMyProfile();
        setEmployee(empData);
        
        // Get attendance for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const data = await attendanceService.getMyAttendance(
          getDateString(startOfMonth),
          getDateString(endOfMonth)
        );
        setAttendances(data);

        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = data.find((a) => a.date.split('T')[0] === today);
        setCanCheckIn(!todayAttendance);
        setCanCheckOut(!!todayAttendance && !todayAttendance.checkOut);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load attendance');
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleCheckIn = async () => {
    try {
      setError('');
      setSuccess('');
      await attendanceService.checkIn();
      setSuccess('Checked in successfully!');
      setCanCheckIn(false);
      setCanCheckOut(true);
      const data = await attendanceService.getMyAttendance();
      setAttendances(data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check in');
      if (err.response?.data?.message?.includes('Employee profile')) {
        setTimeout(() => {
          window.location.href = '/dashboard/profile';
        }, 2000);
      }
    }
  };

  const handleCheckOut = async () => {
    try {
      setError('');
      setSuccess('');
      await attendanceService.checkOut();
      setSuccess('Checked out successfully!');
      setCanCheckOut(false);
      const data = await attendanceService.getMyAttendance();
      setAttendances(data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check out');
    }
  };

  // Show admin view for admins
  if (isAdmin) {
    return <AdminAttendanceView />;
  }

  // Show monthly view for employees if toggled
  if (showMonthlyView && employee?._id) {
    return (
      <MonthlyAttendanceView
        employeeId={employee._id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        isModal={false}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendances.find((a) => a.date.split('T')[0] === today);

  // Get current month name
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">Track your daily attendance and working hours</p>
        </div>
        {!isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              className={canCheckIn ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
            >
              {canCheckIn ? 'Check In' : 'Already Checked In'}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              className={canCheckOut ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
            >
              {canCheckOut ? 'Check Out' : 'Already Checked Out'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {!isAdmin && todayAttendance && (
        <div className="mb-6 bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">Today's Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-blue-600 text-xs font-medium">Check-in</span>
              <p className="text-gray-900 font-semibold mt-1">
                {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString() : 'Not checked in'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-blue-600 text-xs font-medium">Check-out</span>
              <p className="text-gray-900 font-semibold mt-1">
                {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString() : 'Not checked out'}
              </p>
            </div>
            {todayAttendance.hoursWorked && (
              <div className="bg-blue-50 rounded-lg p-3">
                <span className="text-blue-600 text-xs font-medium">Hours Worked</span>
                <p className="text-gray-900 font-semibold mt-1">
                  {Math.floor(todayAttendance.hoursWorked)}h {Math.round((todayAttendance.hoursWorked % 1) * 60)}m
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Attendance - {currentMonth}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Day-wise attendance for the current month
          </p>
        </div>
        <Button
          onClick={() => setShowMonthlyView(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          View Monthly Report
        </Button>
      </div>

      {attendances.length > 0 ? (
        <div className="space-y-4">
          {/* Day-wise list view for better month overview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Hours Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((attendance) => (
                      <tr key={attendance._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(attendance.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${attendance.checkIn ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {attendance.checkIn ? formatTime(attendance.checkIn) : '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${attendance.checkOut ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {attendance.checkOut ? formatTime(attendance.checkOut) : '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${attendance.hoursWorked ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {attendance.hoursWorked
                              ? `${Math.floor(attendance.hoursWorked)}:${String(Math.round((attendance.hoursWorked % 1) * 60)).padStart(2, '0')}`
                              : '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attendance.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : attendance.status === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : attendance.status === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {attendance.status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No attendance records found</p>
          {!isAdmin && (
            <p className="text-gray-400 text-sm mt-2">Start by checking in for today</p>
          )}
        </div>
      )}
    </div>
  );
};
