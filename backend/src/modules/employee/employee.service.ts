import { EmployeeModel } from './employee.model';
import { Employee } from '../../types';
import { generateEmployeeId } from '../../utils/generateEmployeeId';
import { generatePassword } from '../../utils/generatePassword';
import { hashPassword } from '../../utils/hashPassword';
import { UserModel } from '../user/user.model';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const employeeService = {
  async createEmployee(data: Omit<Employee, '_id' | 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<Employee & { loginId: string; temporaryPassword: string }> {
    // Ensure hireDate is a Date object
    const hireDate = data.hireDate instanceof Date ? data.hireDate : new Date(data.hireDate);
    
    // Generate login ID using the format: OI + initials + year + serial
    const employeeId = await generateEmployeeId(data.firstName, data.lastName, hireDate);
    
    // Generate temporary password
    const temporaryPassword = generatePassword(12);
    const hashedPassword = await hashPassword(temporaryPassword);
    
    // Create user account with login ID as email
    const user = await UserModel.create({
      email: employeeId,
      password: hashedPassword,
      role: 'employee',
    });
    
    // Create employee record linked to user
    const employee = await EmployeeModel.create({
      ...data,
      hireDate,
      employeeId,
      userId: user._id,
    });
    
    const employeeData = toPlainObject<Employee>(employee)!;
    return {
      ...employeeData,
      loginId: employeeId,
      temporaryPassword,
    };
  },

  async createEmployeeForExistingUser(
    userId: string,
    data: Omit<Employee, '_id' | 'employeeId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Employee> {
    // Ensure hireDate is a Date object
    const hireDate = data.hireDate instanceof Date ? data.hireDate : new Date(data.hireDate);
    
    // Generate login ID using the format: OI + initials + year + serial
    const employeeId = await generateEmployeeId(data.firstName, data.lastName, hireDate);
    
    // Create employee record linked to existing user
    const employee = await EmployeeModel.create({
      ...data,
      hireDate,
      employeeId,
      userId,
    });
    
    return toPlainObject<Employee>(employee)!;
  },

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const employee = await EmployeeModel.findById(employeeId).populate('userId', 'email role');
    return toPlainObject<Employee>(employee);
  },

  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    const employee = await EmployeeModel.findOne({ userId }).populate('userId', 'email role');
    return toPlainObject<Employee>(employee);
  },

  async getAllEmployees(): Promise<Employee[]> {
    const employees = await EmployeeModel.find().populate('userId', 'email role').sort({ createdAt: -1 });
    return toPlainObjectArray<Employee>(employees);
  },

  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<Employee | null> {
    // Convert hireDate to Date if it's provided as a string
    const updateData = { ...data };
    if (updateData.hireDate && typeof updateData.hireDate === 'string') {
      updateData.hireDate = new Date(updateData.hireDate) as any;
    }
    
    const employee = await EmployeeModel.findByIdAndUpdate(employeeId, updateData, { new: true });
    return toPlainObject<Employee>(employee);
  },

  async deleteEmployee(employeeId: string): Promise<boolean> {
    const result = await EmployeeModel.findByIdAndDelete(employeeId);
    return !!result;
  },
};

