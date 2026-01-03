import { EmployeeModel } from '../modules/employee/employee.model';

export const generateEmployeeId = async (
  firstName: string,
  lastName: string,
  hireDate: Date | string
): Promise<string> => {
  const prefix = 'OI'; // Odoo India
  const firstInitials = firstName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  const lastInitials = lastName.substring(0, 2).toUpperCase().padEnd(2, 'X');
  
  // Convert hireDate to Date if it's a string
  const dateObj = hireDate instanceof Date ? hireDate : new Date(hireDate);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid hire date');
  }
  
  const year = dateObj.getFullYear().toString();
  
  // Build the pattern to find existing employees with the same initials and year
  const pattern = `^${prefix}${firstInitials}${lastInitials}${year}`;
  
  // Find the last employee ID for this pattern to get the next serial number
  const employees = await EmployeeModel.find({
    employeeId: { $regex: pattern },
  }).sort({ employeeId: -1 }).limit(1);
  
  let serialNumber = 1;
  if (employees.length > 0 && employees[0].employeeId) {
    const lastSerial = parseInt(employees[0].employeeId.slice(-4));
    if (!isNaN(lastSerial)) {
      serialNumber = lastSerial + 1;
    }
  }
  
  const serial = serialNumber.toString().padStart(4, '0');
  return `${prefix}${firstInitials}${lastInitials}${year}${serial}`;
};
