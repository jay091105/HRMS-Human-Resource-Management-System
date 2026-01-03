export interface Attendance {
  _id?: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hoursWorked?: number;
  extraHours?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Extended attendance with employee name (for admin view)
export interface AttendanceWithEmployee extends Attendance {
  employeeName?: string;
  employeeCode?: string; // Employee ID code (to avoid conflict with employeeId ObjectId)
}

// Attendance summary counters (for employee view)
export interface AttendanceSummary {
  daysPresent: number;
  leaveCount: number;
  totalWorkingDays: number;
}

// Monthly attendance response
export interface MonthlyAttendanceResponse {
  attendances: Attendance[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    payableDays: number;
    totalHours: number;
  };
}

