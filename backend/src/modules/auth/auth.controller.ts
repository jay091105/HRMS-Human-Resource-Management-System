import { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register(email, password, role);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { loginId, email, password } = req.body;
      const loginIdOrEmail = loginId || email;
      if (!loginIdOrEmail) {
        res.status(400).json({ message: 'Login ID or Email is required' });
        return;
      }
      const result = await authService.login(loginIdOrEmail, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: 'Current password and new password are required' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ message: 'New password must be at least 6 characters' });
        return;
      }
      await authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};

