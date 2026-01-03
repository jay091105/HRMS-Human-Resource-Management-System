export interface Leave {
  _id?: string;
  employeeId: string;
  type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveFormData {
  type: Leave['type'];
  startDate: string;
  endDate: string;
  reason: string;
}

