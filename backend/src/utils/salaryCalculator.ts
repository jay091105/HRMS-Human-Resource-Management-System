import { Payroll } from '../types';

export const calculateTotalSalary = (
  baseSalary: number,
  allowances: number,
  deductions: number,
  bonus: number = 0
): number => {
  return baseSalary + allowances - deductions + bonus;
};

export const calculateMonthlySalary = (
  annualSalary: number,
  allowances: number = 0,
  deductions: number = 0,
  bonus: number = 0
): Payroll => {
  const baseSalary = annualSalary / 12;
  const totalSalary = calculateTotalSalary(baseSalary, allowances, deductions, bonus);

  return {
    baseSalary,
    allowances,
    deductions,
    bonus,
    totalSalary,
  } as Payroll;
};

/**
 * Calculate salary based on attendance and payable days
 * @param annualSalary - Annual salary of the employee
 * @param payableDays - Number of payable days (present + approved leave)
 * @param totalDaysInMonth - Total working days in the month
 * @param allowances - Additional allowances
 * @param deductions - Deductions
 * @param bonus - Bonus amount
 * @returns Calculated payroll with attendance-based salary
 */
export const calculateSalaryWithAttendance = (
  annualSalary: number,
  payableDays: number,
  totalDaysInMonth: number,
  allowances: number = 0,
  deductions: number = 0,
  bonus: number = 0
): Payroll => {
  // Calculate daily rate
  const monthlyBaseSalary = annualSalary / 12;
  const dailyRate = monthlyBaseSalary / totalDaysInMonth;
  
  // Calculate base salary based on payable days
  const attendanceBasedSalary = dailyRate * payableDays;
  
  // Calculate total salary
  const totalSalary = calculateTotalSalary(attendanceBasedSalary, allowances, deductions, bonus);

  return {
    baseSalary: Math.round(attendanceBasedSalary * 100) / 100,
    allowances,
    deductions,
    bonus,
    totalSalary: Math.round(totalSalary * 100) / 100,
  } as Payroll;
};

