import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { UserModel } from '../user/user.model';
import { hashPassword, comparePassword } from '../../utils/hashPassword';
import { User } from '../../types';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  token: string;
}

export const authService = {
  async register(email: string, password: string, role: 'admin' | 'employee' = 'employee'): Promise<AuthResponse> {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      token,
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      token,
    };
  },
};

function generateToken(userId: string, email: string, role: string): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

