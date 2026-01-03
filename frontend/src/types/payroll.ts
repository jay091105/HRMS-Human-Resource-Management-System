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
  paymentDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

