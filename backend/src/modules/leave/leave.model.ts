import mongoose, { Schema, Document } from 'mongoose';
import { Leave } from '../../types';

export interface LeaveDocument extends Omit<Leave, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const leaveSchema = new Schema<LeaveDocument>({
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    } as any,
    type: {
      type: String,
      enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    comments: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveModel = mongoose.model<LeaveDocument>('Leave', leaveSchema as any);

