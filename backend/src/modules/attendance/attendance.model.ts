import mongoose, { Schema, Document } from 'mongoose';
import { Attendance } from '../../types';

export interface AttendanceDocument extends Omit<Attendance, '_id' | 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<AttendanceDocument>({
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    } as any,
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day'],
      default: 'present',
    },
    hoursWorked: {
      type: Number,
    },
    extraHours: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', attendanceSchema as any);

