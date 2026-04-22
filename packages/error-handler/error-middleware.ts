import { Request, Response } from 'express';
import { AppError } from './index';

export const errorMiddleware = (req: Request, err: Error, res: Response) => {
  if (err instanceof AppError) {
    console.log(`Error: ${req.method} ${req.url} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}), // spread operator to add details if they are defined
    });
  }
  console.log(`Unhandled error: ${err}`);

  return res.status(500).json({
    error: 'Something went wrong!',
  });
};
