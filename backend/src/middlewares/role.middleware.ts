import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export const roleMiddleware = (allowedRoles: ('admin' | 'employee')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as unknown as AuthRequest).user;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};

