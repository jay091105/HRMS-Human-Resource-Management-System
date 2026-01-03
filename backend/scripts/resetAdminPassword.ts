import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/modules/user/user.model';
import { hashPassword } from '../src/utils/hashPassword';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get admin credentials from command line or use defaults
    const email = process.argv[2] || 'admin@dayflow.com';
    const password = process.argv[3] || 'admin123';

    // Find the admin user
    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      console.log('Creating new admin user...');
      
      // Create admin user
      const hashedPassword = await hashPassword(password);
      const admin = await UserModel.create({
        email,
        password: hashedPassword,
        role: 'admin',
      });

      console.log('✅ Admin user created successfully!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Role: admin`);
    } else {
      // Update existing user password
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;
      await user.save();

      console.log('✅ Admin password reset successfully!');
      console.log(`Email: ${email}`);
      console.log(`New Password: ${password}`);
      console.log(`Role: ${user.role}`);
    }

    console.log(`\nYou can now login with these credentials.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword();

