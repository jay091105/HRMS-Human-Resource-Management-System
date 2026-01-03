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
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('filter');
  
  const [, setAttendances] = useState<AttendanceWithEmployee[]>([]);
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

      setAttendances(attendanceData);
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
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Not Applied
        </span>
      );
    }

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Present' },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Late' },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' },
      'half-day': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Half Day' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    
    // Check if on leave
    if (status === 'leave') {
      return (
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Leave
        </span>
      );
    }

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
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
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Attendance</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
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
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.present}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.absent}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.onLeave}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Not Applied</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.notApplied}</p>
            </div>
            <div className="bg-gray-100 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Date Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <button
            onClick={handleToday}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isToday(selectedDate)
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Today
          </button>

          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              aria-label="Previous day"
            >
              ←
            </button>

            <input
              type="date"
              value={getDateString(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleNextDay}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              aria-label="Next day"
              disabled={isToday(selectedDate)}
            >
              →
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Time Worked
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendances.length > 0 ? (
                filteredAttendances.map((attendance) => {
                  const employeeName = attendance.employeeName || 'Unknown';
                  const initials = getInitials(employeeName);
                  const avatarColor = getAvatarColor(employeeName);
                  
                  return (
                    <tr key={attendance._id || attendance.employeeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold`}>
                          {initials}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                        {attendance.employeeCode && (
                          <div className="text-sm text-gray-500">{attendance.employeeCode}</div>
                        )}
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
                        <span className={`text-sm ${
                          attendance.checkOut && attendance.hoursWorked && attendance.hoursWorked > 0 
                            ? 'text-green-600 font-medium' 
                            : attendance.checkOut 
                            ? 'text-gray-600' 
                            : 'text-orange-600 font-medium'
                        }`}>
                          {formatTimeWorked(attendance.hoursWorked, !!attendance.checkOut)}
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
                                  employeeId: String(empId),
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
                        className="w-16 h-16 text-gray-400 mb-4"
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
                      <p className="text-gray-500 text-lg">
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
