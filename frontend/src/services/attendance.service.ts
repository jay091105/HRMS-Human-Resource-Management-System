import api from './api';
import { Attendance, AttendanceWithEmployee } from '../types/attendance';

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

  async getAllAttendance(startDate?: string, endDate?: string): Promise<AttendanceWithEmployee[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<AttendanceWithEmployee[]>(`/attendance?${params.toString()}`);
    return response.data;
  },

  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },

  async getStatistics(date?: string): Promise<{
    total: number;
    present: number;
    absent: number;
    onLeave: number;
    notApplied: number;
  }> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const response = await api.get(`/attendance/statistics?${params.toString()}`);
    return response.data;
  },


  async getMonthlyAttendance(employeeId: string, month: number, year: number): Promise<{
    attendances: Attendance[];
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      leaveDays: number;
      payableDays: number;
      totalHours: number;
    };
  }> {
    const response = await api.get(`/attendance/${employeeId}/monthly?month=${month}&year=${year}`);
    return response.data;
  },
};

