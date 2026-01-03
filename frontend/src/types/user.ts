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
  email: string;
  password: string;
  role?: 'admin' | 'employee';
}

