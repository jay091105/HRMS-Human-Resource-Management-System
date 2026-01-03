import { Request, Response } from 'express';
import { leaveService } from './leave.service';
import { EmployeeModel } from '../employee/employee.model';

export const leaveController = {
  async createLeave(req: Request, res: Response): Promise<void> {
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

      const leave = await leaveService.createLeave({
        ...req.body,
        employeeId: employee._id.toString(),
      });
      res.status(201).json(leave);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async getLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.getLeaveById(id);
      if (!leave) {
        res.status(404).json({ message: 'Leave request not found' });
        return;
      }
      res.status(200).json(leave);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getMyLeaves(req: Request, res: Response): Promise<void> {
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

      const leaves = await leaveService.getLeavesByEmployee(employee._id.toString());
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllLeaves(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const leaves = await leaveService.getAllLeaves(status as string);
      res.status(200).json(leaves);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateLeaveStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (status !== 'approved' && status !== 'rejected') {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }

      const leave = await leaveService.updateLeaveStatus(id, status, userId, comments);
      if (!leave) {
        res.status(404).json({ message: 'Leave request not found' });
        return;
      }
      res.status(200).json(leave);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await leaveService.deleteLeave(id);
      if (!deleted) {
        res.status(404).json({ message: 'Leave request not found' });
        return;
      }
      res.status(200).json({ message: 'Leave request deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};

