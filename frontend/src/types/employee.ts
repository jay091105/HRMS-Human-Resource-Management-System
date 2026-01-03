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
  createdAt?: string;
  updatedAt?: string;
}

