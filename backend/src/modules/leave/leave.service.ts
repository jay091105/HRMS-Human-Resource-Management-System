import { LeaveModel } from './leave.model';
import { Leave } from '../../types';
import { toPlainObject, toPlainObjectArray } from '../../utils/toPlainObject';

export const leaveService = {
  async createLeave(data: Omit<Leave, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Leave> {
    const days = Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const leave = await LeaveModel.create({
      ...data,
      days,
    });

    return toPlainObject<Leave>(leave)!;
  },

  async getLeaveById(leaveId: string): Promise<Leave | null> {
    const leave = await LeaveModel.findById(leaveId)
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('approvedBy', 'email');
    return toPlainObject<Leave>(leave);
  },

  async getLeavesByEmployee(employeeId: string): Promise<Leave[]> {
    const leaves = await LeaveModel.find({ employeeId })
      .sort({ createdAt: -1 })
      .populate('employeeId', 'firstName lastName employeeId');
    return toPlainObjectArray<Leave>(leaves);
  },

  async getAllLeaves(status?: string): Promise<Leave[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const leaves = await LeaveModel.find(query)
      .sort({ createdAt: -1 })
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('approvedBy', 'email');
    return toPlainObjectArray<Leave>(leaves);
  },

  async updateLeaveStatus(
    leaveId: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    comments?: string
  ): Promise<Leave | null> {
    const leave = await LeaveModel.findByIdAndUpdate(
      leaveId,
      {
        status,
        approvedBy,
        approvedAt: new Date(),
        comments,
      },
      { new: true }
    )
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('approvedBy', 'email');

    return toPlainObject<Leave>(leave);
  },

  async deleteLeave(leaveId: string): Promise<boolean> {
    const result = await LeaveModel.findByIdAndDelete(leaveId);
    return !!result;
  },
};

