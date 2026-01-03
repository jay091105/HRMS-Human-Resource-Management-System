import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { EmployeeModel } from './employee.model';

export const employeeController = {
  async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async createMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Check if profile already exists
      const existing = await EmployeeModel.findOne({ userId });
      if (existing) {
        res.status(400).json({ message: 'Employee profile already exists' });
        return;
      }

      const employee = await employeeService.createEmployee({
        ...req.body,
        userId,
      });
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async getEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.status(200).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const employee = await employeeService.getEmployeeByUserId(userId);
      if (!employee) {
        res.status(404).json({ message: 'Employee profile not found' });
        return;
      }
      res.status(200).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllEmployees(req: Request, res: Response): Promise<void> {
    try {
      const employees = await employeeService.getAllEmployees();
      res.status(200).json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await employeeService.updateEmployee(id, req.body);
      if (!employee) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.status(200).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const employee = await employeeService.getEmployeeByUserId(userId);
      if (!employee) {
        res.status(404).json({ message: 'Employee profile not found' });
        return;
      }

      const updated = await employeeService.updateEmployee(employee._id!, req.body);
      if (!updated) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await employeeService.deleteEmployee(id);
      if (!deleted) {
        res.status(404).json({ message: 'Employee not found' });
        return;
      }
      res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },
};
