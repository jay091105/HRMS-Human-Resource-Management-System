import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/dashboard/employees', label: 'Employees', icon: '👥', adminOnly: true },
  { path: '/dashboard/attendance', label: 'Attendance', icon: '⏰' },
  { path: '/dashboard/leave', label: 'Leave', icon: '📅' },
  { path: '/dashboard/payroll', label: 'Payroll', icon: '💰' },
  { path: '/dashboard/profile', label: 'My Profile', icon: '👤' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useRole();

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

