import { PayrollModel } from './payroll.model';
import { Payroll } from '../../types';
import { calculateMonthlySalary, calculateSalaryWithAttendance } from '../../utils/salaryCalculator';
import { EmployeeModel } from '../employee/employee.model';
import { attendanceService } from '../attendance/attendance.service';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const payrollService = {
  async createPayroll(
    employeeId: string,
    month: number,
    year: number,
    allowances: number = 0,
    deductions: number = 0,
    bonus: number = 0,
    useAttendance: boolean = true
  ): Promise<Payroll> {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    let salaryData: Payroll;

    if (useAttendance) {
      // Get attendance data for the month
      const attendanceData = await attendanceService.getMonthlyAttendance(employeeId, month, year);
      const totalDaysInMonth = attendanceData.summary.totalDays;
      const payableDays = attendanceData.summary.payableDays;

      // Calculate salary based on attendance
      salaryData = calculateSalaryWithAttendance(
        employee.salary,
        payableDays,
        totalDaysInMonth,
        allowances,
        deductions,
        bonus
      );
    } else {
      // Use standard monthly calculation
      salaryData = calculateMonthlySalary(employee.salary, allowances, deductions, bonus);
    }

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
    
    // If baseSalary is updated, update the employee's annual salary and monthly wage
    if (data.baseSalary && payroll) {
      const employeeId = typeof payroll.employeeId === 'string' 
        ? payroll.employeeId 
        : (payroll.employeeId as any)?._id?.toString() || payroll.employeeId;
      
      // Calculate annual salary from monthly base salary
      const annualSalary = data.baseSalary * 12;
      
      // Update employee's salary and monthly wage
      await EmployeeModel.findByIdAndUpdate(employeeId, { 
        salary: annualSalary,
        monthlyWage: data.baseSalary
      });
    }
    
    return toPlainObject<Payroll>(payroll);
  },

  async deletePayroll(payrollId: string): Promise<boolean> {
    const result = await PayrollModel.findByIdAndDelete(payrollId);
    return !!result;
  },

  async markAsPaid(payrollId: string): Promise<Payroll> {
    const payroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      {
        status: 'paid',
        paymentDate: new Date(),
      },
      { new: true }
    ).populate('employeeId', 'userId firstName lastName email');

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    return toPlainObject<Payroll>(payroll)!;
  },
};

