import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceService } from '../../../services/attendance.service';
import { AttendanceWithEmployee } from '../../../types/attendance';
import { formatTime, getDateString } from '../../../utils/formatDate';
import { Input } from '../../../components/ui/Input';
import { getInitials, getAvatarColor } from '../../../utils/avatar';
import { MonthlyAttendanceView } from './MonthlyAttendanceView';

interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  onLeave: number;
  notApplied: number;
}

export const AdminAttendanceView: React.FC = () => {
  const [attendances, setAttendances] = useState<AttendanceWithEmployee[]>([]);
  const [allEmployees, setAllEmployees] = useState<AttendanceWithEmployee[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<AttendanceWithEmployee[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics>({
    total: 0,
    present: 0,
    absent: 0,
    onLeave: 0,
    notApplied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployeeForMonthly, setSelectedEmployeeForMonthly] = useState<{
    employeeId: string;
    employeeName: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    let filtered = allEmployees;
    
    // Apply status filter from URL
    if (statusFilter) {
      if (statusFilter === 'present') {
        filtered = filtered.filter(emp => emp.status === 'present' || emp.status === 'late');
      } else if (statusFilter === 'absent') {
        filtered = filtered.filter(emp => emp.status === 'absent');
      } else if (statusFilter === 'on-leave') {
        // Filter employees on leave (they might have status as string or be identified differently)
        filtered = filtered.filter(emp => (emp.status as string) === 'on-leave' || (emp.status as string) === 'On Leave');
      } else if (statusFilter === 'not-applied') {
        filtered = filtered.filter(emp => !emp.status || (emp.status as string) === 'not-applied');
      }
    }
    
    // Apply search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeName?.toLowerCase().includes(query) ||
          emp.employeeCode?.toLowerCase().includes(query)
      );
    }
    
    setFilteredAttendances(filtered);
  }, [searchQuery, allEmployees, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const dateString = getDateString(selectedDate);
      
      // Fetch attendance and statistics in parallel
      const [attendanceData, statsData] = await Promise.all([
        attendanceService.getAllAttendance(dateString),
        attendanceService.getStatistics(dateString),
      ]);

      setStatistics(statsData);

      // Create list of all employees (with or without attendance)
      // For now, we'll use the attendance data. In a real app, you'd fetch all employees separately
      const employeesList: AttendanceWithEmployee[] = attendanceData.map((att) => ({
        ...att,
        status: att.status || 'not-applied',
      }));

      // Add employees on leave (they won't have attendance records)
      // This would need to be enhanced to fetch from leave service
      setAllEmployees(employeesList);
      setFilteredAttendances(employeesList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attendance');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatTimeWorked = (hours?: number, hasCheckOut?: boolean): string => {
    // If check-out is missing, show "Incomplete"
    if (hasCheckOut === false) {
      return 'Incomplete';
    }
    // If hours is 0 or undefined, show 0h if checked out, otherwise Incomplete
    if (!hours || hours === 0) {
      return hasCheckOut ? '0h' : 'Incomplete';
    }
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
    if (!status || status === 'not-applied') {
      return (
        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          Not Applied
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
    
    // Check if on leave
    if (status === 'leave') {
      return (
        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
          On Leave
        </span>
      );
    }

    return (
      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Attendance Management</h1>
        <p className="text-sm text-gray-600">View and manage employee attendance records</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Status Filter Badge */}
      {statusFilter && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="text-sm font-medium">
              Filter: {statusFilter === 'present' ? 'Present' : statusFilter === 'absent' ? 'Absent' : statusFilter === 'on-leave' ? 'On Leave' : 'Not Applied'}
            </span>
            <button
              onClick={() => {
                searchParams.delete('filter');
                setSearchParams(searchParams);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{statistics.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Present</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{statistics.present}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2.5">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{statistics.absent}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2.5">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">On Leave</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{statistics.onLeave}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2.5">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Not Applied</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">{statistics.notApplied}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={handleToday}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isToday(selectedDate)
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>

          <div className="flex-1 w-full sm:max-w-xs">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              aria-label="Previous day"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <input
              type="date"
              value={getDateString(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />

            <button
              onClick={handleNextDay}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next day"
              disabled={isToday(selectedDate)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Date Display and Company Total Hours */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold text-gray-700">
          {selectedDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-gray-600">Total Company Hours</p>
          <p className="text-xl font-bold text-blue-700">
            {formatTimeWorked(
              filteredAttendances
                .filter(att => att.checkOut && att.hoursWorked)
                .reduce((sum, att) => sum + (att.hoursWorked || 0), 0),
              true
            )}
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name + Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Time Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAttendances.length > 0 ? (
                filteredAttendances.map((attendance) => {
                  const employeeName = attendance.employeeName || 'Unknown';
                  const initials = getInitials(employeeName);
                  const avatarColor = getAvatarColor(employeeName);
                  
                  return (
                    <tr key={attendance._id || attendance.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-sm`}>
                          {initials}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                        {attendance.employeeCode && (
                          <div className="text-xs text-gray-500 mt-0.5">{attendance.employeeCode}</div>
                        )}
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
                        <span className={`text-sm ${attendance.hoursWorked && attendance.hoursWorked > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {attendance.checkOut ? formatTimeWorked(attendance.hoursWorked) : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(attendance.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const empId = attendance.employeeId;
                              if (empId) {
                                console.log('Opening monthly report for employee:', empId, employeeName);
                                setSelectedEmployeeForMonthly({
                                  employeeId: typeof empId === 'string' ? empId : empId.toString(),
                                  employeeName: employeeName,
                                });
                              } else {
                                console.error('Employee ID not found in attendance:', attendance);
                                setError('Employee ID not found. Please refresh the page.');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Attendance</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        {searchQuery ? 'No employees found matching your search' : 'No attendance records for this date'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Attendance Modal */}
      {selectedEmployeeForMonthly && (
        <MonthlyAttendanceView
          employeeId={selectedEmployeeForMonthly.employeeId}
          employeeName={selectedEmployeeForMonthly.employeeName}
          isModal={true}
          onClose={() => setSelectedEmployeeForMonthly(null)}
        />
      )}
    </div>
  );
};
