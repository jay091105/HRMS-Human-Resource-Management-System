export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'personal', label: 'Personal' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'other', label: 'Other' },
] as const;

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half-day',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
} as const;

