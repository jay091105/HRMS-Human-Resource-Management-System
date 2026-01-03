import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  console.error('Error:', err);

  res.status(500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

