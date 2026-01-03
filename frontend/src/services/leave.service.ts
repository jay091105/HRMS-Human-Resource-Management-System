import api from './api';
import { Leave, LeaveFormData } from '../types/leave';

export const leaveService = {
  async createLeave(data: LeaveFormData): Promise<Leave> {
    const response = await api.post<Leave>('/leaves', data);
    return response.data;
  },

  async getMyLeaves(): Promise<Leave[]> {
    const response = await api.get<Leave[]>('/leaves/me');
    return response.data;
  },

  async getLeaveById(id: string): Promise<Leave> {
    const response = await api.get<Leave>(`/leaves/${id}`);
    return response.data;
  },

  async getAllLeaves(status?: string): Promise<Leave[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<Leave[]>(`/leaves${params}`);
    return response.data;
  },

  async updateLeaveStatus(id: string, status: 'approved' | 'rejected', comments?: string): Promise<Leave> {
    const response = await api.patch<Leave>(`/leaves/${id}/status`, { status, comments });
    return response.data;
  },

  async deleteLeave(id: string): Promise<void> {
    await api.delete(`/leaves/${id}`);
  },
};

