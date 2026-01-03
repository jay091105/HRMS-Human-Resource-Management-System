import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { EmployeeModel } from '../employee/employee.model';

export const attendanceController = {
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const employee = await EmployeeModel.findOne({ userId });
      if (!employee) {
        res.status(404).json({ message: 'Employee profile not found' });
        return;
      }

      const attendance = await attendanceService.checkIn(employee._id.toString());
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const employee = await EmployeeModel.findOne({ userId });
      if (!employee) {
        res.status(404).json({ message: 'Employee profile not found' });
        return;
      }

      const attendance = await attendanceService.checkOut(employee._id.toString());
      res.status(200).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async getMyAttendance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const employee = await EmployeeModel.findOne({ userId });
      if (!employee) {
        res.status(404).json({ message: 'Employee profile not found' });
        return;
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const attendances = await attendanceService.getAttendanceByEmployee(
        employee._id.toString(),
        start,
        end
      );
      res.status(200).json(attendances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const attendances = await attendanceService.getAllAttendance(start, end);
      res.status(200).json(attendances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.updateAttendance(id, req.body);
      if (!attendance) {
        res.status(404).json({ message: 'Attendance not found' });
        return;
      }
      res.status(200).json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};

