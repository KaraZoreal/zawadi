import { v4 as uuidv4 } from 'uuid';

/**
 * Error handler middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error
  console.error(`[ERROR ${errorId}] ${timestamp}`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    body: req.body
  });

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (err.message?.includes('duplicate')) {
    statusCode = 409;
    code = 'CONFLICT';
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const responseMessage = isDevelopment ? message : 'An error occurred. Please try again later.';

  // Send response
  res.status(statusCode).json({
    error: code,
    message: responseMessage,
    errorId: errorId,
    timestamp,
    ...(isDevelopment && { stack: err.stack })
  });
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Create validation error
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Create authorization error
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Create forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Create not found error
 */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Create conflict error
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Create rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
