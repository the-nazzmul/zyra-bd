export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

//Not found error
export class NotFoundError extends AppError {
  constructor(message = 'Resources not found') {
    super(404, message);
  }
}

// validation error
export class ValidationError extends AppError {
  constructor(message = 'Invalid request data', details?: unknown) {
    super(400, message, details, true);
  }
}

// authentication error
export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(401, message);
  }
}

// authorization error
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(403, message);
  }
}

// database error
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: unknown) {
    super(500, message, details, true);
  }
}

// rate limit error
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message);
  }
}

export { ErrorMiddleware } from './error-middleware.js';
