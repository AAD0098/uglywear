const errorHandler = require("../src/middleware/errorHandler");
const AppError = require("../src/utils/AppError");

describe("errorHandler middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { method: "GET", originalUrl: "/test" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
    next = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 500 status code when no statusCode is set on error", () => {
    const err = new Error("Something went wrong");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Something went wrong" })
    );
  });

  it("should use the error's statusCode when provided", () => {
    const err = AppError.notFound("Resource not found");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Resource not found" })
    );
  });

  it("should log errors with status >= 500", () => {
    const err = AppError.internal("Server Error");

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("GET /test:"),
      err
    );
  });

  it("should not log errors with status < 500", () => {
    const err = AppError.badRequest("Bad Request");

    errorHandler(err, req, res, next);

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should return generic message in production for non-operational errors", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const err = new Error("Detailed internal error");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Internal Server Error" })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should return actual message in production for operational AppErrors", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const err = AppError.notFound("Resource not found");

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Resource not found" })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should return detailed message with stack in non-production for 5xx errors", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const err = new Error("Detailed internal error");
    err.statusCode = 500;

    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
    expect(jsonCall.message).toBe("Detailed internal error");
    expect(jsonCall.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("should not include stack trace in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const err = new Error("Internal error");
    err.statusCode = 500;

    errorHandler(err, req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("should delegate to next() if headers are already sent", () => {
    res.headersSent = true;
    const err = new Error("Some error");

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 'Internal Server Error' when error has no message", () => {
    const err = new Error();
    err.message = "";

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Internal Server Error" })
    );
  });
});
