import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
      <div className="px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-900">
                  {user.email}
                </span>
                <span className="text-xs text-gray-500">
                  {isAdmin ? 'Administrator' : 'Employee'}
                </span>
              </div>
              
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {getInitials(user.email)}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

