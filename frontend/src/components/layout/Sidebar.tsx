import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { leaveService } from '../../services/leave.service';
import { Leave } from '../../types/leave';
import { formatDate } from '../../utils/formatDate';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const EmployeesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const AttendanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LeaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PayrollIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/dashboard/attendance', label: 'Attendance', icon: <AttendanceIcon /> },
  { path: '/dashboard/employees', label: 'Employees', icon: <EmployeesIcon />, adminOnly: true },
  { path: '/dashboard/payroll', label: 'Payroll', icon: <PayrollIcon /> },
  { path: '/dashboard/profile', label: 'Profile', icon: <ProfileIcon /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useRole();
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    if (!isAdmin) {
      const fetchRecentLeaves = async () => {
        try {
          setLeavesLoading(true);
          const leaves = await leaveService.getMyLeaves();
          // Get last 5 leaves, sorted by most recent first
          const sortedLeaves = leaves.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.startDate).getTime();
            const dateB = new Date(b.createdAt || b.startDate).getTime();
            return dateB - dateA;
          });
          setRecentLeaves(sortedLeaves.slice(0, 5));
        } catch (err: any) {
          // Silently fail if employee profile doesn't exist yet
          if (err?.response?.status !== 404) {
            console.error('Error fetching recent leaves:', err);
          }
        } finally {
          setLeavesLoading(false);
        }
      };

      fetchRecentLeaves();
    }
  }, [isAdmin]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen fixed left-0 top-0 shadow-xl z-40">
      <div className="p-6">
        {/* Logo Section */}
        <div className="mb-8 pb-6 border-b border-blue-700">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dayflow HRMS</h1>
              <p className="text-xs text-blue-200">Human Resources</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-900 shadow-md transform scale-105'
                    : 'text-blue-100 hover:bg-blue-700 hover:shadow-lg hover:translate-x-1'
                }`}
              >
                <div className={isActive ? 'text-blue-600' : ''}>
                  {item.icon}
                </div>
                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Recent Leaves Section - Only for Employees */}
        {!isAdmin && (
          <div className="border-t border-blue-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <LeaveIcon />
              <h3 className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Recent Leaves</h3>
            </div>
            {leavesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300 mx-auto"></div>
              </div>
            ) : recentLeaves.length > 0 ? (
              <div className="space-y-2">
                {recentLeaves.map((leave) => (
                  <Link
                    key={leave._id}
                    to="/dashboard/leave"
                    className="block p-3 bg-blue-800/50 hover:bg-blue-700 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate capitalize">
                          {leave.type || 'Leave'}
                        </p>
                        <p className="text-xs text-blue-200 mt-0.5">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(leave.status)}`}
                      >
                        {getStatusLabel(leave.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-blue-300">No leave records</p>
              </div>
            )}
            <Link
              to="/dashboard/leave"
              className="block mt-4 text-center text-xs text-blue-200 hover:text-white transition-colors font-medium"
            >
              View All Leaves →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

