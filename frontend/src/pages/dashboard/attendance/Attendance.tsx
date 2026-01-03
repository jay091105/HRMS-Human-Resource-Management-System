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
      const result = await attendanceService.checkOut();
      setSuccess('Checked out successfully!');
      setCanCheckOut(false);
      setCanCheckIn(false);
      
      // Refresh attendance data to show updated hours worked
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const data = await attendanceService.getMyAttendance(
        getDateString(startOfMonth),
        getDateString(endOfMonth)
      );
      setAttendances(data);
      
      // Update today's attendance state
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = data.find((a) => a.date.split('T')[0] === today);
      if (todayAttendance) {
        setCanCheckOut(false);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check out');
      console.error('Check-out error:', err);
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
    if (hours === undefined || hours === null) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0 && m > 0) {
      return `${h} ${h === 1 ? 'hour' : 'hours'} ${m} ${m === 1 ? 'minute' : 'minutes'}`;
    } else if (h > 0) {
      return `${h} ${h === 1 ? 'hour' : 'hours'}`;
    } else if (m > 0) {
      return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
    }
    return '0 hours';
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance</h1>
        <p className="text-gray-600">Track your daily attendance and working hours</p>
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Today's Attendance</h3>
              <p className="text-sm text-gray-500">Mark your attendance for today</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  canCheckIn
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!canCheckOut}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  canCheckOut
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Status Cards */}
      {!isAdmin && todayAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Check In</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : '--'}
                </p>
              </div>
              <div className="bg-green-500 rounded-xl p-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Check Out</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : '--'}
                </p>
              </div>
              <div className="bg-blue-500 rounded-xl p-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {todayAttendance.hoursWorked && todayAttendance.checkOut && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Hours Worked</p>
                  <p className="text-lg font-semibold text-gray-700 mt-2">
                    {formatTime(todayAttendance.checkIn)} to {formatTime(todayAttendance.checkOut)}
                  </p>
                  <p className="text-xl text-purple-600 font-bold mt-2">
                    = {formatTimeWorked(todayAttendance.hoursWorked)}
                  </p>
                </div>
                <div className="bg-purple-500 rounded-xl p-3 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Attendance Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Attendance - {currentMonth}
            </h2>
            <p className="text-sm text-gray-600">Day-wise attendance for the current month</p>
          </div>
          <button
            onClick={() => setShowMonthlyView(true)}
            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
                        {(() => {
                          // If check-in and check-out are the same, show "0 hr"
                          if (attendance.checkIn && attendance.checkOut) {
                            const checkInTime = new Date(attendance.checkIn).getTime();
                            const checkOutTime = new Date(attendance.checkOut).getTime();
                            if (checkInTime === checkOutTime) {
                              return <span className="text-sm text-gray-600 font-medium">0 hr</span>;
                            }
                          }
                          
                          // If both check-in and check-out exist and hours worked is calculated
                          if (attendance.checkOut && attendance.checkIn && attendance.hoursWorked !== undefined && attendance.hoursWorked !== null && attendance.hoursWorked > 0) {
                            return (
                              <div className="text-sm">
                                <div className="text-gray-600">
                                  {formatTime(attendance.checkIn)} to {formatTime(attendance.checkOut)}
                                </div>
                                <div className="text-green-600 font-medium mt-1">
                                  = {formatTimeWorked(attendance.hoursWorked)}
                                </div>
                              </div>
                            );
                          }
                          
                          // If check-in exists but no check-out
                          if (attendance.checkIn && !attendance.checkOut) {
                            return <span className="text-sm text-gray-500">Still working...</span>;
                          }
                          
                          // Default: show nothing or dash
                          return <span className="text-sm text-gray-400">--</span>;
                        })()}
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