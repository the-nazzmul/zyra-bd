import type { ErrorRequestHandler } from 'express';
import { AppError } from './index.js';
import { Request, Response, NextFunction } from 'express';

export const ErrorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
