import React, { useEffect, useState } from 'react';
import { useRole } from '../../../hooks/useRole';
import { attendanceService } from '../../../services/attendance.service';
import { Attendance } from '../../../types/attendance';
import { AttendanceCard } from '../../../components/cards/AttendanceCard';
import { Button } from '../../../components/ui/Button';

export const AttendancePage: React.FC = () => {
  const { isAdmin } = useRole();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setError('');
        const data = isAdmin
          ? await attendanceService.getAllAttendance()
          : await attendanceService.getMyAttendance();
        setAttendances(data);

        if (!isAdmin) {
          const today = new Date().toISOString().split('T')[0];
          const todayAttendance = data.find((a) => a.date.split('T')[0] === today);
          setCanCheckIn(!todayAttendance);
          setCanCheckOut(!!todayAttendance && !todayAttendance.checkOut);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load attendance');
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track your daily attendance and working hours</p>
        </div>
        {!isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              variant={canCheckIn ? 'primary' : 'secondary'}
            >
              {canCheckIn ? 'Check In' : 'Already Checked In'}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              variant={canCheckOut ? 'primary' : 'secondary'}
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
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Today's Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Check-in:</span>
              <span className="ml-2 font-medium text-blue-900">
                {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString() : 'Not checked in'}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Check-out:</span>
              <span className="ml-2 font-medium text-blue-900">
                {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString() : 'Not checked out'}
              </span>
            </div>
            {todayAttendance.hoursWorked && (
              <div className="col-span-2">
                <span className="text-blue-700">Hours worked:</span>
                <span className="ml-2 font-medium text-blue-900">{todayAttendance.hoursWorked} hours</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isAdmin ? 'All Attendance Records' : 'My Attendance History'}
        </h2>
      </div>

      {attendances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendances.map((attendance) => (
            <AttendanceCard key={attendance._id} attendance={attendance} />
          ))}
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
