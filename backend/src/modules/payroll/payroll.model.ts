import mongoose, { Schema, Document } from 'mongoose';
import { Payroll } from '../../types';

export interface PayrollDocument extends Omit<Payroll, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const payrollSchema = new Schema<PayrollDocument>({
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    } as any,
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    totalSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const PayrollModel = mongoose.model<PayrollDocument>('Payroll', payrollSchema as any);

