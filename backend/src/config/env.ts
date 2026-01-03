import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms',
  jwtSecret: (process.env.JWT_SECRET || 'your-secret-key-change-in-production') as string,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

