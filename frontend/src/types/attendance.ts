export interface Attendance {
  _id?: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  hoursWorked?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

