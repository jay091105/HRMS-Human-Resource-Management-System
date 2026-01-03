import express, { Application } from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Dayflow HRMS API is running' });
});

// Error handling
app.use(errorMiddleware);

export default app;

