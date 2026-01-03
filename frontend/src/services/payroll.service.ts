import api from './api';
import { Payroll } from '../types/payroll';

export const payrollService = {
  async getMyPayrolls(month?: number, year?: number): Promise<Payroll[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<Payroll[]>(`/payroll/me?${params.toString()}`);
    return response.data;
  },

  async getPayrollById(id: string): Promise<Payroll> {
    const response = await api.get<Payroll>(`/payroll/${id}`);
    return response.data;
  },

  async getAllPayrolls(month?: number, year?: number): Promise<Payroll[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<Payroll[]>(`/payroll?${params.toString()}`);
    return response.data;
  },

  async createPayroll(data: {
    employeeId: string;
    month: number;
    year: number;
    allowances?: number;
    deductions?: number;
    bonus?: number;
  }): Promise<Payroll> {
    const response = await api.post<Payroll>('/payroll', data);
    return response.data;
  },

  async updatePayroll(id: string, data: Partial<Payroll>): Promise<Payroll> {
    const response = await api.put<Payroll>(`/payroll/${id}`, data);
    return response.data;
  },

  async deletePayroll(id: string): Promise<void> {
    await api.delete(`/payroll/${id}`);
  },
};

