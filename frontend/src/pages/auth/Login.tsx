import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../../components/forms/LoginForm';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Dayflow HRMS
        </h1>
        <h2 className="text-2xl font-semibold text-center mb-6">Sign in Page</h2>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>First time setup?</strong> Create admin user by running:<br />
            <code className="text-xs bg-blue-100 px-1 rounded">cd backend && npm run create-admin</code>
          </p>
        </div>
      </div>
    </div>
  );
};

