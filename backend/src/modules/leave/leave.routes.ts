import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.post('/', leaveController.createLeave);
router.get('/me', leaveController.getMyLeaves);
router.get('/:id', leaveController.getLeave);
router.delete('/:id', leaveController.deleteLeave);

// Admin routes
router.get('/', roleMiddleware(['admin']), leaveController.getAllLeaves);
router.patch('/:id/status', roleMiddleware(['admin']), leaveController.updateLeaveStatus);

export default router;

