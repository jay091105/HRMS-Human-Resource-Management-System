import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get my profile (both admin and employee)
router.get('/me', employeeController.getMyProfile);
// Create my profile (for employees to create their own profile)
router.post('/me', employeeController.createMyProfile);
// Update my profile
router.put('/me', employeeController.updateMyProfile);

// Admin only routes
router.post('/', roleMiddleware(['admin']), employeeController.createEmployee);
router.get('/', roleMiddleware(['admin']), employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployee);
router.put('/:id', roleMiddleware(['admin']), employeeController.updateEmployee);
router.delete('/:id', roleMiddleware(['admin']), employeeController.deleteEmployee);

export default router;

