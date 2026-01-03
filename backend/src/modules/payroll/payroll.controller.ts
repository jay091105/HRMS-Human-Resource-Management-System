import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { EmployeeModel } from '../employee/employee.model';

export const payrollController = {
  async createPayroll(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, month, year, allowances, deductions, bonus } = req.body;
      const payroll = await payrollService.createPayroll(
        employeeId,
        month,
        year,
        allowances,
        deductions,
        bonus
      );
      res.status(201).json(payroll);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async getPayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.getPayrollById(id);
      if (!payroll) {
        res.status(404).json({ message: 'Payroll not found' });
        return;
      }
      res.status(200).json(payroll);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getMyPayrolls(req: Request, res: Response): Promise<void> {
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

      const { month, year } = req.query;
      const m = month ? parseInt(month as string) : undefined;
      const y = year ? parseInt(year as string) : undefined;

      const payrolls = await payrollService.getPayrollByEmployee(employee._id.toString(), m, y);
      res.status(200).json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAllPayrolls(req: Request, res: Response): Promise<void> {
    try {
      const { month, year } = req.query;
      const m = month ? parseInt(month as string) : undefined;
      const y = year ? parseInt(year as string) : undefined;

      const payrolls = await payrollService.getAllPayrolls(m, y);
      res.status(200).json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updatePayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.updatePayroll(id, req.body);
      if (!payroll) {
        res.status(404).json({ message: 'Payroll not found' });
        return;
      }
      res.status(200).json(payroll);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async deletePayroll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await payrollService.deletePayroll(id);
      if (!deleted) {
        res.status(404).json({ message: 'Payroll not found' });
        return;
      }
      res.status(200).json({ message: 'Payroll deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async markAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.markAsPaid(id);
      res.status(200).json(payroll);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};

