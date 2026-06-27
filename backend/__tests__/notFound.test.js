const notFound = require("../src/middleware/notFound");

describe("notFound middleware", () => {
  it("should call next with a 404 AppError", () => {
    const req = { method: "GET", originalUrl: "/api/unknown" };
    const res = {};
    const next = jest.fn();

    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain("Route not found");
    expect(err.message).toContain("GET");
    expect(err.message).toContain("/api/unknown");
  });

  it("should include the HTTP method in the error message", () => {
    const req = { method: "POST", originalUrl: "/api/items" };
    const res = {};
    const next = jest.fn();

    notFound(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.message).toContain("POST");
  });

  it("should produce an operational error", () => {
    const req = { method: "DELETE", originalUrl: "/api/resource/1" };
    const res = {};
    const next = jest.fn();

    notFound(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.isOperational).toBe(true);
  });
});
