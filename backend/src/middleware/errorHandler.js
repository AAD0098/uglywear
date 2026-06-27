const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof AppError && err.isOperational;
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`,
      err,
    );
  }

  const message =
    isProduction && !isOperational && statusCode >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  const response = {
    success: false,
    message,
  };

  if (!isProduction && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
