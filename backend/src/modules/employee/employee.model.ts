import mongoose, { Schema, Document } from 'mongoose';
import { Employee } from '../../types';

export interface EmployeeDocument extends Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const employeeSchema = new Schema<EmployeeDocument>({
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    } as any,
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    hireDate: {
      type: Date,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    address: {
      type: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeModel = mongoose.model<EmployeeDocument>('Employee', employeeSchema as any);

