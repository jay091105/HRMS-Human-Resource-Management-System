import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { employeeService } from '../../services/employee.service';
import { ProfileRequired } from '../../pages/ProfileRequired';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useRole();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      // Admins don't need employee profile
      if (isAdmin) {
        setHasProfile(true);
        setLoading(false);
        return;
      }

      // If not authenticated, let ProtectedRoute handle it
      if (!isAuthenticated || !user) {
        setHasProfile(false);
        setLoading(false);
        return;
      }

      try {
        // Try to fetch employee profile
        await employeeService.getMyProfile();
        setHasProfile(true);
      } catch (error: any) {
        // If 404, profile doesn't exist
        if (error?.response?.status === 404) {
          setHasProfile(false);
        } else {
          // For other errors, assume profile exists to avoid blocking
          console.error('Error checking profile:', error);
          setHasProfile(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [isAuthenticated, user, isAdmin]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile...</p>
        </div>
      </div>
    );
  }

  // If profile doesn't exist and user is not admin, show profile required page
  if (!hasProfile && !isAdmin) {
    return <ProfileRequired />;
  }

  return <>{children}</>;
};

