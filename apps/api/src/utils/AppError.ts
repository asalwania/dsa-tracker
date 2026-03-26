/**
 * Custom application error class for consistent error handling.
 * Distinguishes operational errors (expected) from programming errors (unexpected).
 */
export class AppError extends Error {
  /** HTTP status code */
  public readonly statusCode: number;

  /** Machine-readable error code */
  public readonly code: string;

  /** Whether this is an operational (expected) error */
  public readonly isOperational: boolean;

  /** Additional error details (e.g. validation field errors) */
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates a 400 Bad Request error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param details - Optional validation details
   */
  static badRequest(
    message = 'Bad request',
    code = 'BAD_REQUEST',
    details?: unknown,
  ): AppError {
    return new AppError(message, 400, code, true, details);
  }

  /**
   * Creates a 401 Unauthorized error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
    return new AppError(message, 401, code);
  }

  /**
   * Creates a 403 Forbidden error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, code);
  }

  /**
   * Creates a 404 Not Found error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, code);
  }

  /**
   * Creates a 409 Conflict error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static conflict(message = 'Resource already exists', code = 'CONFLICT'): AppError {
    return new AppError(message, 409, code);
  }

  /**
   * Creates a 429 Too Many Requests error.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static tooManyRequests(
    message = 'Too many requests, please try again later',
    code = 'TOO_MANY_REQUESTS',
  ): AppError {
    return new AppError(message, 429, code);
  }

  /**
   * Creates a 500 Internal Server Error.
   * Non-operational by default (unexpected error).
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): AppError {
    return new AppError(message, 500, code, false);
  }
}
