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
}

// Attendance summary counters (for employee view)
export interface AttendanceSummary {
  daysPresent: number;
  leaveCount: number;
  totalWorkingDays: number;
}

