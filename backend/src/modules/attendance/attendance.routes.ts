import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);
router.get('/me', attendanceController.getMyAttendance);

// Admin routes
router.get('/', roleMiddleware(['admin']), attendanceController.getAllAttendance);
router.patch('/:id', roleMiddleware(['admin']), attendanceController.updateAttendance);

export default router;

