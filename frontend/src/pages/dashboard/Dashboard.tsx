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

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  onLeave: number;
  notApplied: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    activeEmployees: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    onLeave: 0,
    notApplied: 0,
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
          const [employees, attendance, leaves, stats] = await Promise.all([
            employeeService.getAllEmployees(),
            attendanceService.getAllAttendance(),
            leaveService.getAllLeaves('pending'),
            attendanceService.getStatistics(),
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
          setAttendanceStats(stats);
          setRecentAttendance(attendance.slice(0, 5));
          setRecentLeaves(leaves.slice(0, 5));
        } else {
          // For employees, handle 404 errors gracefully (no profile yet)
          let attendance: Attendance[] = [];
          let leaves: Leave[] = [];
          
          try {
            attendance = await attendanceService.getMyAttendance();
          } catch (err: any) {
            // If 404, user doesn't have profile yet - just use empty array
            if (err?.response?.status !== 404) {
              throw err;
            }
          }
          
          try {
            leaves = await leaveService.getMyLeaves();
          } catch (err: any) {
            // If 404, user doesn't have profile yet - just use empty array
            if (err?.response?.status !== 404) {
              throw err;
            }
          }
          
          setRecentAttendance(attendance.slice(0, 5));
          setRecentLeaves(leaves.filter((l) => l.status === 'pending').slice(0, 5));
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        // Only show error for non-404 errors
        if (err?.response?.status !== 404) {
          setError('Failed to load dashboard data');
        }
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's an overview of your HRMS.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">Live Status</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Attendance</h2>
            <button
              onClick={() => navigate('/dashboard/attendance')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h2>
            <button
              onClick={() => navigate('/dashboard/leave')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
        <>
          {/* Attendance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/dashboard/employees')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/dashboard/attendance')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Present Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.present}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/dashboard/attendance')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Absent Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.absent}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/dashboard/leave')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">On Leave</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.onLeave}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate('/dashboard/attendance')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Not Applied</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.notApplied}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/dashboard/attendance')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Mark Attendance</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/leave')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Apply Leave</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/payroll')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">View Payslip</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold">Update Profile</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
