export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  company?: string;
  name?: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'admin' | 'employee';
}

