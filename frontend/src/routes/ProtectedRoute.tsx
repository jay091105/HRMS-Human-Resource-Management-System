import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProfileGuard } from '../components/guards/ProfileGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  requireProfile = true 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-admin routes, check if profile exists
  if (requireProfile && user?.role !== 'admin') {
    return <ProfileGuard>{children}</ProfileGuard>;
  }

  return <>{children}</>;
};

