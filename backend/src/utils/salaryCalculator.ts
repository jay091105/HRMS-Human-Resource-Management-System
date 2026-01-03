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

