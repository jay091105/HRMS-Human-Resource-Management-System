import { PayrollModel } from './payroll.model';
import { Payroll } from '../../types';
import { calculateMonthlySalary } from '../../utils/salaryCalculator';
import { EmployeeModel } from '../employee/employee.model';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const payrollService = {
  async createPayroll(
    employeeId: string,
    month: number,
    year: number,
    allowances: number = 0,
    deductions: number = 0,
    bonus: number = 0
  ): Promise<Payroll> {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const salaryData = calculateMonthlySalary(employee.salary, allowances, deductions, bonus);

    const payroll = await PayrollModel.create({
      employeeId,
      month,
      year,
      baseSalary: salaryData.baseSalary,
      allowances: salaryData.allowances,
      deductions: salaryData.deductions,
      bonus: salaryData.bonus,
      totalSalary: salaryData.totalSalary,
    });

    return toPlainObject<Payroll>(payroll)!;
  },

  async getPayrollById(payrollId: string): Promise<Payroll | null> {
    const payroll = await PayrollModel.findById(payrollId)
      .populate('employeeId', 'firstName lastName employeeId email');
    return toPlainObject<Payroll>(payroll);
  },

  async getPayrollByEmployee(employeeId: string, month?: number, year?: number): Promise<Payroll[]> {
    const query: any = { employeeId };
    if (month && year) {
      query.month = month;
      query.year = year;
    }

    const payrolls = await PayrollModel.find(query)
      .sort({ year: -1, month: -1 })
      .populate('employeeId', 'firstName lastName employeeId email');
    return toPlainObjectArray<Payroll>(payrolls);
  },

  async getAllPayrolls(month?: number, year?: number): Promise<Payroll[]> {
    const query: any = {};
    if (month && year) {
      query.month = month;
      query.year = year;
    }

    const payrolls = await PayrollModel.find(query)
      .sort({ year: -1, month: -1 })
      .populate('employeeId', 'firstName lastName employeeId email');
    return toPlainObjectArray<Payroll>(payrolls);
  },

  async updatePayroll(payrollId: string, data: Partial<Payroll>): Promise<Payroll | null> {
    const payroll = await PayrollModel.findByIdAndUpdate(payrollId, data, { new: true });
    return toPlainObject<Payroll>(payroll);
  },

  async deletePayroll(payrollId: string): Promise<boolean> {
    const result = await PayrollModel.findByIdAndDelete(payrollId);
    return !!result;
  },
};

