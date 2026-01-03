import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/me', payrollController.getMyPayrolls);
router.get('/:id', payrollController.getPayroll);

// Admin routes
router.post('/', roleMiddleware(['admin']), payrollController.createPayroll);
router.get('/', roleMiddleware(['admin']), payrollController.getAllPayrolls);
router.put('/:id', roleMiddleware(['admin']), payrollController.updatePayroll);
router.delete('/:id', roleMiddleware(['admin']), payrollController.deletePayroll);

export default router;

