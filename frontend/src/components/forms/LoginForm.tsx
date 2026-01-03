import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email: loginId, password });
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      
      // Provide helpful error messages
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 404 || err.response?.status === 0) {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <Input
        type="text"
        label="Login Id/Email :-"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        required
        placeholder="Enter your login ID or email"
      />
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="Enter your password"
      />
      <Button type="submit" isLoading={isLoading} className="w-full">
        SIGN IN
      </Button>
    </form>
  );
};

