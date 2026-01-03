import api from './api';
import { AuthResponse, LoginCredentials, SignupData } from '../types/user';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      loginId: credentials.email, // Support both loginId and email
      password: credentials.password,
    });
    return response.data;
  },

  async register(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      role: data.role || 'employee',
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

