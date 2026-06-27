const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
