/**
 * Custom application error with HTTP status code.
 * Extends the native Error to carry a statusCode for the error handler.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request") {
    return new AppError(message, 400);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message = "Not Found") {
    return new AppError(message, 404);
  }

  static conflict(message = "Conflict") {
    return new AppError(message, 409);
  }

  static internal(message = "Internal Server Error") {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
