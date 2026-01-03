import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProfileRequirementCheck } from '../components/ProfileRequirementCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  skipProfileCheck?: boolean; // For profile page itself, skip the check
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  skipProfileCheck = false,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Skip profile check for profile page itself and admin routes
  if (skipProfileCheck || adminOnly) {
    return <>{children}</>;
  }

  // For employee routes, check if profile exists
  return <ProfileRequirementCheck>{children}</ProfileRequirementCheck>;
};

