/**
 * Wraps an async Express route handler so thrown errors are forwarded to
 * the error-handling middleware automatically — eliminates repetitive
 * try/catch blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
