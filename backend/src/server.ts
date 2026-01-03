import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

