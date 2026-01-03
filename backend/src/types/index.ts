export interface User {
  _id?: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  _id?: string;
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: Date;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attendance {
  _id?: string;
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hoursWorked?: number;
  extraHours?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Leave {
  _id?: string;
  employeeId: string;
  type: 'paid' | 'sick' | 'unpaid' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'other';
  startDate: Date;
  endDate: Date;
  days: number;
  allocation: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string; // URL or path to attachment (mandatory for sick leave)
  approvedBy?: string;
  approvedAt?: Date;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Payroll {
  _id?: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  bonus?: number;
  totalSalary: number;
  status: 'pending' | 'paid' | 'processing';
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'admin' | 'employee';
  };
}

