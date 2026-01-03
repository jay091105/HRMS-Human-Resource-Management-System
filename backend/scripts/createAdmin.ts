import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/modules/user/user.model';
import { hashPassword } from '../src/utils/hashPassword';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get admin credentials from command line or use defaults
    const email = process.argv[2] || 'admin@dayflow.com';
    const password = process.argv[3] || 'admin123';

    // Check if admin already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists!`);
      process.exit(1);
    }

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
    console.log(`\nYou can now login with these credentials.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

