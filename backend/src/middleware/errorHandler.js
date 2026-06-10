const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  if (statusCode >= 500) {
    console.error(err);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorHandler;
