import { Request, Response, NextFunction } from 'express';
import { EmployeeModel } from '../modules/employee/employee.model';
import { AuthRequest } from '../types';

/**
 * Middleware to check if employee profile exists
 * Blocks access to routes if profile is not created (for non-admin users)
 */
export const profileMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as unknown as AuthRequest).user;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Admins don't need employee profile
    if (user.role === 'admin') {
      next();
      return;
    }

    // Check if employee profile exists
    const employee = await EmployeeModel.findOne({ userId: user.userId });

    if (!employee) {
      res.status(403).json({ 
        message: 'Employee profile not found. Please create your profile to access this resource.',
        requiresProfile: true 
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error('Profile middleware error:', error);
    res.status(500).json({ message: 'Error checking profile' });
  }
};

