import { AttendanceModel } from './attendance.model';
import { Attendance } from '../../types';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const attendanceService = {
  async checkIn(employeeId: string, checkInTime?: Date): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await AttendanceModel.findOne({
      employeeId,
      date: today,
    });

    if (existing) {
      throw new Error('Already checked in today');
    }

    const checkIn = checkInTime || new Date();
    const status = checkIn.getHours() > 9 ? 'late' : 'present';

    const attendance = await AttendanceModel.create({
      employeeId,
      date: today,
      checkIn,
      status,
    });

    return toPlainObject<Attendance>(attendance)!;
  },

  async checkOut(employeeId: string, checkOutTime?: Date): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceModel.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      throw new Error('No check-in found for today');
    }

    if (attendance.checkOut) {
      throw new Error('Already checked out today');
    }

    const checkOut = checkOutTime || new Date();
    const hoursWorked = (checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);

    attendance.checkOut = checkOut;
    attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;

    await attendance.save();
    return toPlainObject<Attendance>(attendance)!;
  },

  async getAttendanceByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    const query: any = { employeeId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await AttendanceModel.find(query)
      .sort({ date: -1 })
      .populate('employeeId', 'firstName lastName employeeId');

    return toPlainObjectArray<Attendance>(attendances);
  },

  async getAllAttendance(startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    const query: any = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await AttendanceModel.find(query)
      .sort({ date: -1 })
      .populate('employeeId', 'firstName lastName employeeId');

    return toPlainObjectArray<Attendance>(attendances);
  },

  async updateAttendance(attendanceId: string, data: Partial<Attendance>): Promise<Attendance | null> {
    const attendance = await AttendanceModel.findByIdAndUpdate(attendanceId, data, { new: true });
    return toPlainObject<Attendance>(attendance);
  },
};

