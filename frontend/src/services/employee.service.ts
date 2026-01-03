import api from './api';
import { Employee } from '../types/employee';

export const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/employees');
    return response.data;
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  async getMyProfile(): Promise<Employee> {
    const response = await api.get<Employee>('/employees/me');
    return response.data;
  },

  async createMyProfile(data: Omit<Employee, '_id' | 'employeeId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const response = await api.post<Employee>('/employees/me', data);
    return response.data;
  },

  async updateMyProfile(data: Partial<Employee>): Promise<Employee> {
    const response = await api.put<Employee>('/employees/me', data);
    return response.data;
  },

  async createEmployee(data: Omit<Employee, '_id' | 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/employees/${id}`);
  },

  async checkProfileExists(): Promise<boolean> {
    try {
      await this.getMyProfile();
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      // For other errors, assume profile exists to avoid blocking
      return true;
    }
  },
};

