import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { LandingPage } from '../pages/LandingPage';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { EmployeeList } from '../pages/dashboard/employees/EmployeeList';
import { EmployeeProfile } from '../pages/dashboard/employees/EmployeeProfile';
import { AttendancePage } from '../pages/dashboard/attendance/Attendance';
import { ApplyLeave } from '../pages/dashboard/leave/ApplyLeave';
import { LeaveRequests } from '../pages/dashboard/leave/LeaveRequests';
import { SalaryView } from '../pages/dashboard/payroll/SalaryView';
import { MyProfile } from '../pages/dashboard/profile/MyProfile';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/employees"
        element={
          <ProtectedRoute adminOnly>
            <EmployeeList />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/employees/:id"
        element={
          <ProtectedRoute adminOnly>
            <EmployeeProfile />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/leave"
        element={
          <ProtectedRoute>
            <LeaveRequests />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/leave/apply"
        element={
          <ProtectedRoute>
            <ApplyLeave />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/payroll"
        element={
          <ProtectedRoute>
            <SalaryView />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute skipProfileCheck>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      
    </Routes>
  );
};

