import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { profileMiddleware } from '../../middlewares/profile.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes (require profile)
router.post('/', profileMiddleware, leaveController.createLeave);
router.get('/me', profileMiddleware, leaveController.getMyLeaves);
router.get('/:id', profileMiddleware, leaveController.getLeave);
router.delete('/:id', profileMiddleware, leaveController.deleteLeave);

// Admin routes
router.get('/', roleMiddleware(['admin']), leaveController.getAllLeaves);
router.patch('/:id/status', roleMiddleware(['admin']), leaveController.updateLeaveStatus);

export default router;

