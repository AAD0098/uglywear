const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error(err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const response = {
    message:
      isProduction && statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  };

  if (!isProduction && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
