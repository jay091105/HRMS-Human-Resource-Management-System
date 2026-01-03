import { useAuthStore } from '../store/auth.store';

export const useRole = () => {
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  
  return {
    isAdmin,
    isEmployee,
    role: user?.role,
  };
};

