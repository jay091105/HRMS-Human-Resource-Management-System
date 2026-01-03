import { UserModel } from './user.model';
import { User } from '../../types';
import { toPlainObject } from '../../utils/toPlainObject';

export const userService = {
  async getUserById(userId: string): Promise<User | null> {
    const user = await UserModel.findById(userId).select('-password');
    return toPlainObject<User>(user);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).select('-password');
    return toPlainObject<User>(user);
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(userId, data, { new: true }).select('-password');
    return toPlainObject<User>(user);
  },
};

