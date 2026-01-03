export interface SalaryComponent {
  name: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage or fixed amount
  amount: number; // calculated amount
  description?: string;
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
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Private Info
  dateOfBirth?: string;
  nationality?: string;
  personalEmail?: string;
  gender?: string;
  maritalStatus?: string;
  profilePicture?: string;
  // Additional Info
  about?: string;
  interests?: string;
  whatILoveAboutJob?: string;
  skills?: string[];
  certifications?: string[];
  // Salary Info
  monthlyWage?: number;
  yearlyWage?: number;
  workingDaysPerWeek?: number;
  breakTimeHours?: number;
  salaryComponents?: SalaryComponent[];
  pfEmployeeRate?: number;
  pfEmployerRate?: number;
  professionalTax?: number;
  // Bank Details
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  // Company
  company?: string;
  manager?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

