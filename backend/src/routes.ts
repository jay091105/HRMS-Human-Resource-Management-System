import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import employeeRoutes from './modules/employee/employee.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import payrollRoutes from './modules/payroll/payroll.routes';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/employees', employeeRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api/leaves', leaveRoutes);
router.use('/api/payroll', payrollRoutes);

export default router;

