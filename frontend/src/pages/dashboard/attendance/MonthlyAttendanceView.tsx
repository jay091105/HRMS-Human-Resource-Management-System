import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../../services/attendance.service';
import { MonthlyAttendanceResponse } from '../../../types/attendance';
import { formatTime, formatDate } from '../../../utils/formatDate';
import { Modal } from '../../../components/ui/Modal';

interface MonthlyAttendanceViewProps {
  employeeId?: string;
  employeeName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const MonthlyAttendanceView: React.FC<MonthlyAttendanceViewProps> = ({
  employeeId: propEmployeeId,
  employeeName: propEmployeeName,
  onClose,
  isModal = false,
}) => {
  const { employeeId: paramEmployeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  
  const employeeId = propEmployeeId || paramEmployeeId || '';
  const [data, setData] = useState<MonthlyAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (employeeId) {
      fetchMonthlyAttendance();
    }
  }, [employeeId, selectedMonth, selectedYear]);

  const fetchMonthlyAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await attendanceService.getMonthlyAttendance(employeeId, selectedMonth, selectedYear);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load monthly attendance');
      console.error('Error fetching monthly attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatTimeWorked = (hours?: number): string => {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Present' },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Late' },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' },
      'half-day': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Half Day' },
    };

    const config = statusConfig[status || ''] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'N/A' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const content = (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Monthly Attendance Report
          </h2>
          {propEmployeeName && (
            <p className="text-gray-600 mt-1">{propEmployeeName}</p>
          )}
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4">
        <button
          onClick={handlePreviousMonth}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
        >
          ← Previous
        </button>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          disabled={selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()}
        >
          Next →
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <p className="text-sm font-medium text-gray-600">Total Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.totalDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.presentDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.leaveDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
              <p className="text-sm font-medium text-gray-600">Payable Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.summary.payableDays}</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm font-medium text-gray-600">Absent Days</p>
              <p className="text-xl font-bold text-red-600 mt-1">{data.summary.absentDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatTimeWorked(data.summary.totalHours)}</p>
            </div>
          </div>

          {/* Attendance Table */}
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
                  {data.attendances.length > 0 ? (
                    data.attendances.map((attendance) => (
                      <tr key={attendance._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(attendance.date)}
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
                            {formatTimeWorked(attendance.hoursWorked)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(attendance.status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-gray-500">No attendance records for this month</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  if (isModal) {
    return (
      <Modal isOpen={true} onClose={onClose || (() => {})} size="xl">
        {content}
      </Modal>
    );
  }

  return <div className="min-h-screen bg-gray-50">{content}</div>;
};

