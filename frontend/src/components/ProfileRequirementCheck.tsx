import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { employeeService } from '../services/employee.service';

interface ProfileRequirementCheckProps {
  children: React.ReactNode;
}

/**
 * Component that checks if employee has created their profile.
 * Redirects to profile creation if profile doesn't exist (only for employees, not admins).
 */
export const ProfileRequirementCheck: React.FC<ProfileRequirementCheckProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
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

      // Check if employee profile exists
      try {
        await employeeService.getMyProfile();
        setHasProfile(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasProfile(false);
        } else {
          // On error, assume profile exists to avoid blocking access
          console.error('Error checking profile:', err);
          setHasProfile(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      checkProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile...</p>
        </div>
      </div>
    );
  }

  // If employee doesn't have profile, redirect to profile page
  if (!hasProfile) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return <>{children}</>;
};


