import { AttendanceModel } from './attendance.model';
import { Attendance } from '../../types';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';
import { EmployeeModel } from '../employee/employee.model';
import { LeaveModel } from '../leave/leave.model';
import mongoose from 'mongoose';

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
    
    // Calculate total time worked (Check-out - Check-in)
    // If check-in and check-out are the same, hours worked = 0
    const timeDiff = checkOut.getTime() - attendance.checkIn.getTime();
    const hoursWorked = Math.max(0, timeDiff / (1000 * 60 * 60)); // Ensure non-negative

    // Get employee to fetch scheduled shift hours
    const employee = await EmployeeModel.findById(employeeId);
    const scheduledShiftHours = (employee as any)?.scheduledShiftHours || 8; // Default 8 hours

    // Calculate extra hours (work hours - scheduled shift)
    const extraHours = Math.max(0, hoursWorked - scheduledShiftHours);

    attendance.checkOut = checkOut;
    attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    attendance.extraHours = Math.round(extraHours * 100) / 100;

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

  async getMonthlyAttendance(employeeId: string, month: number, year: number): Promise<{
    attendances: Attendance[];
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      leaveDays: number;
      payableDays: number;
      totalHours: number;
    };
  }> {
    
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Convert employeeId to ObjectId if it's a string
    const employeeObjectId = mongoose.Types.ObjectId.isValid(employeeId) 
      ? new mongoose.Types.ObjectId(employeeId) 
      : employeeId;

    // Get all attendance records for the month
    const attendances = await AttendanceModel.find({
      employeeId: employeeObjectId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .populate('employeeId', 'firstName lastName employeeId');

    // Get approved leaves for the month
    const leaves = await LeaveModel.find({
      employeeId: employeeObjectId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: 'approved',
    });

    // Calculate summary
    const totalDays = endDate.getDate(); // Days in the month
    const presentDays = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentDays = attendances.filter(a => a.status === 'absent').length;
    
    // Calculate leave days (overlapping with the month)
    let leaveDays = 0;
    leaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const monthStart = new Date(startDate);
      const monthEnd = new Date(endDate);
      
      const overlapStart = leaveStart > monthStart ? leaveStart : monthStart;
      const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;
      
      if (overlapStart <= overlapEnd) {
        const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        leaveDays += days;
      }
    });

    // Calculate payable days: present days + approved leave days
    // Absent days and missing attendance reduce payable days
    const missingDays = totalDays - attendances.length - leaveDays;
    const payableDays = presentDays + leaveDays;

    // Calculate total hours
    const totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

    return {
      attendances: toPlainObjectArray<Attendance>(attendances),
      summary: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        payableDays,
        totalHours: Math.round(totalHours * 100) / 100,
      },
    };
  },

  async getAllAttendance(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query: any = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      // If only startDate is provided, treat it as a specific date
      const dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(startDate);
      dateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dateStart, $lte: dateEnd };
    }

    // First get attendances without populate to preserve employeeId
    const attendancesRaw = await AttendanceModel.find(query).lean();
    
    // Get unique employee IDs
    const employeeIds = [...new Set(attendancesRaw.map((a: any) => a.employeeId?.toString()))].filter(Boolean);
    
    // Fetch employees separately
    const employees = await EmployeeModel.find({ _id: { $in: employeeIds } })
      .select('firstName lastName employeeId email')
      .lean();
    
    const employeeMap = new Map(employees.map((emp: any) => [emp._id.toString(), emp]));
    
    // Format response with employee information
    return attendancesRaw.map((attendance: any) => {
      const employeeId = attendance.employeeId?.toString();
      const employee = employeeId ? employeeMap.get(employeeId) : null;
      
      const result: any = {
        _id: attendance._id?.toString(),
        employeeId: employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
        hoursWorked: attendance.hoursWorked,
        extraHours: attendance.extraHours || 0,
        notes: attendance.notes,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      };
      
      if (employee) {
        result.employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        result.employeeCode = employee.employeeId || '';
      }
      
      return result;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      // Sort by employee name
      const nameA = (a.employeeName || '').toLowerCase();
      const nameB = (b.employeeName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  async getAttendanceStatistics(date: Date): Promise<{
    total: number;
    present: number;
    absent: number;
    onLeave: number;
    notApplied: number;
  }> {

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get all active employees
    const totalEmployees = await EmployeeModel.countDocuments({ status: 'active' });

    // Get attendance records for the date
    const attendances = await AttendanceModel.find({
      date: { $gte: dateStart, $lte: dateEnd },
    });

    const present = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const absent = attendances.filter(a => a.status === 'absent').length;

    // Get employees on leave for this date
    const leaves = await LeaveModel.find({
      startDate: { $lte: dateEnd },
      endDate: { $gte: dateStart },
      status: 'approved',
    });

    const onLeave = leaves.length;

    // Get employee IDs who have attendance records
    const employeeIdsWithAttendance = new Set(
      attendances.map(a => a.employeeId.toString())
    );

    // Get employee IDs on leave
    const employeeIdsOnLeave = new Set(
      leaves.map(l => l.employeeId.toString())
    );

    // Count employees with attendance records (excluding those on leave)
    const employeesWithAttendance = attendances.filter(
      a => !employeeIdsOnLeave.has(a.employeeId.toString())
    ).length;

    // Count employees without any record (not on leave and no attendance)
    const allEmployeeIds = new Set([
      ...Array.from(employeeIdsWithAttendance),
      ...Array.from(employeeIdsOnLeave),
    ]);

    const employeesWithRecords = await EmployeeModel.countDocuments({
      _id: { $in: Array.from(allEmployeeIds) },
      status: 'active',
    });

    const notApplied = Math.max(0, totalEmployees - employeesWithRecords);

    return {
      total: totalEmployees,
      present,
      absent,
      onLeave,
      notApplied: Math.max(0, notApplied),
    };
  },

  async updateAttendance(attendanceId: string, data: Partial<Attendance>): Promise<Attendance | null> {
    const attendance = await AttendanceModel.findByIdAndUpdate(attendanceId, data, { new: true });
    return toPlainObject<Attendance>(attendance);
  },
};

