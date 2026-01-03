export interface Leave {
  _id?: string;
  employeeId: string;
  type: 'paid' | 'sick' | 'unpaid' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  allocation: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string; // URL or path to attachment (mandatory for sick leave)
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveFormData {
  type: 'paid' | 'sick' | 'unpaid';
  startDate: string;
  endDate: string;
  allocation: number;
  reason: string;
  attachment?: File | string; // File for upload or URL if already uploaded
}

// Extended leave with employee name (for admin view)
export interface LeaveWithEmployee extends Leave {
  employeeName?: string;
}

// Leave balance (for employee view)
export interface LeaveBalance {
  paidTimeOff: number;
  sickLeave: number;
  unpaidLeave: number;
}

