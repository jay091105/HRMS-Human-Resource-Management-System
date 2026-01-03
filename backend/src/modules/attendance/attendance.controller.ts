import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { EmployeeModel } from '../employee/employee.model';
import { LeaveModel } from '../leave/leave.model';

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

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const statistics = await attendanceService.getAttendanceStatistics(targetDate);
      res.status(200).json(statistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },


  async getMonthlyAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;

      if (!month || !year) {
        res.status(400).json({ message: 'Month and year are required' });
        return;
      }

      const monthNum = parseInt(month as string, 10);
      const yearNum = parseInt(year as string, 10);

      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        res.status(400).json({ message: 'Invalid month or year' });
        return;
      }

      // Check if user is admin or the employee themselves
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (userRole !== 'admin') {
        // Employee can only view their own attendance
        const employee = await EmployeeModel.findOne({ userId });
        if (!employee || employee._id.toString() !== employeeId) {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
      }

      const result = await attendanceService.getMonthlyAttendance(employeeId, monthNum, yearNum);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};

