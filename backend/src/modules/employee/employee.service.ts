import { EmployeeModel } from './employee.model';
import { Employee } from '../../types';
import { generateEmployeeId } from '../../utils/generateEmployeeId';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const employeeService = {
  async createEmployee(data: Omit<Employee, '_id' | 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const employeeId = generateEmployeeId();
    const employee = await EmployeeModel.create({ ...data, employeeId });
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
    const employee = await EmployeeModel.findByIdAndUpdate(employeeId, data, { new: true });
    return toPlainObject<Employee>(employee);
  },

  async deleteEmployee(employeeId: string): Promise<boolean> {
    const result = await EmployeeModel.findByIdAndDelete(employeeId);
    return !!result;
  },
};

