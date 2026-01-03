import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { LoginCredentials, SignupData } from '../types/user';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Initialize from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuth(parsedUser, storedToken);
      } catch (error) {
        clearAuth();
      }
    }
  }, [setAuth, clearAuth]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setAuth(response.user, response.token);
    return response;
  };

  const register = async (data: SignupData) => {
    const response = await authService.register(data);
    setAuth(response.user, response.token);
    return response;
  };

  const logout = () => {
    authService.logout();
    clearAuth();
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };
};

