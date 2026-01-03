import api from './api';
import { Attendance } from '../types/attendance';

export const attendanceService = {
  async checkIn(): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendance/checkin');
    return response.data;
  },

  async checkOut(): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendance/checkout');
    return response.data;
  },

  async getMyAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<Attendance[]>(`/attendance/me?${params.toString()}`);
    return response.data;
  },

  async getAllAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<Attendance[]>(`/attendance?${params.toString()}`);
    return response.data;
  },

  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },
};

