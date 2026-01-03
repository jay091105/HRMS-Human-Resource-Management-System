import React, { useEffect, useState } from 'react';
import { useRole } from '../../../hooks/useRole';
import { attendanceService } from '../../../services/attendance.service';
import { Attendance } from '../../../types/attendance';
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
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendances.find((a) => a.date.split('T')[0] === today);

  // Get current month name
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const formatTimeWorked = (hours?: number): string => {
    if (!hours || hours === 0) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}m`;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          N/A
        </span>
      );
    }

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      present: { bg: 'bg-green-50', text: 'text-green-700', label: 'Present' },
      late: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Late' },
      absent: { bg: 'bg-red-50', text: 'text-red-700', label: 'Absent' },
      'half-day': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Half Day' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Attendance</h1>
        <p className="text-sm text-gray-600">Track your daily attendance and working hours</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Check In/Out Actions */}
      {!isAdmin && (
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Today's Attendance</h3>
              <p className="text-xs text-gray-500">Mark your attendance for today</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  canCheckIn
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!canCheckOut}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  canCheckOut
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Status Cards */}
      {!isAdmin && todayAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check In</p>
                <p className="text-xl font-semibold text-gray-900 mt-2">
                  {todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : '--'}
                </p>
              </div>
<<<<<<< Updated upstream
              <div className="bg-green-50 rounded-lg p-2.5">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
=======
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
                          {attendance.checkOut && attendance.checkIn && attendance.hoursWorked ? (
                            <div className="text-sm">
                              <div className="text-gray-600">
                                {formatTime(attendance.checkIn)} to {formatTime(attendance.checkOut)}
                              </div>
                              <div className="text-green-600 font-medium mt-1">
                                = {(() => {
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
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
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
>>>>>>> Stashed changes
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Out</p>
                <p className="text-xl font-semibold text-gray-900 mt-2">
                  {todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : '--'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {todayAttendance.hoursWorked && (
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours Worked</p>
                  <p className="text-xl font-semibold text-gray-900 mt-2">
                    {formatTimeWorked(todayAttendance.hoursWorked)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Attendance Section */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Attendance - {currentMonth}
            </h2>
            <p className="text-xs text-gray-500">Day-wise attendance for the current month</p>
          </div>
          <button
            onClick={() => setShowMonthlyView(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            View Monthly Report
          </button>
        </div>

        {attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attendances
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((attendance) => (
                    <tr key={attendance._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(attendance.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${attendance.checkIn ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {attendance.checkIn ? formatTime(attendance.checkIn) : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${attendance.checkOut ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {attendance.checkOut ? formatTime(attendance.checkOut) : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${attendance.hoursWorked ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {attendance.hoursWorked ? formatTimeWorked(attendance.hoursWorked) : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(attendance.status)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No attendance records found</p>
            {!isAdmin && (
              <p className="text-gray-400 text-xs mt-1">Start by checking in for today</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
