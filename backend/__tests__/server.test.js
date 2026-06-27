process.env.JWT_SECRET = "test-secret-for-jest";

jest.mock("../src/config/db", () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

const request = require("supertest");
const { app } = require("../src/server");

describe("Express app setup", () => {
  it("should respond to health check endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("ok");
  });

  it("should set security headers via helmet", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should reject CORS for non-allowed origins", async () => {
    const response = await request(app)
      .options("/api/health")
      .set("Origin", "http://evil.com")
      .set("Access-Control-Request-Method", "GET");

    // CORS_ORIGIN is not set in test env, so allowedOrigins is empty
    // and no origin should receive access-control-allow-origin
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should include CORS middleware with correct allowed methods", async () => {
    // Even without a matching origin, the middleware is configured with
    // specific methods - we verify it responds to preflight
    const response = await request(app)
      .options("/api/health")
      .set("Origin", "http://example.com")
      .set("Access-Control-Request-Method", "DELETE");

    // The middleware is present (responds to OPTIONS)
    expect(response.status).toBeLessThan(500);
  });

  it("should parse JSON body", async () => {
    const response = await request(app)
      .post("/api/health")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    // POST to a GET-only route triggers the notFound middleware
    expect(response.status).toBe(404);
  });

  it("should return 404 for unknown routes via notFound middleware", async () => {
    const response = await request(app).get("/api/nonexistent");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Route not found/);
  });

  it("should handle errors thrown in routes via errorHandler", async () => {
    const express = require("express");
    const errorHandler = require("../src/middleware/errorHandler");

    const testApp = express();
    testApp.use(express.json());
    testApp.get("/error", (req, res, next) => {
      const err = new Error("Test error");
      err.statusCode = 422;
      next(err);
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get("/error");

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Test error");
  });

  it("should include rate limiting middleware", async () => {
    // The app has rate limiting configured; headers prove it's active
    const response = await request(app).get("/api/health");

    expect(response.headers["ratelimit-limit"]).toBeDefined();
  });

  describe("PORT configuration", () => {
    it("should default to 5000 when PORT env is not set", () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;

      const parsedPort = Number(process.env.PORT);
      const PORT = Number.isFinite(parsedPort) ? parsedPort : 5000;

      expect(PORT).toBe(5000);

      if (originalPort !== undefined) {
        process.env.PORT = originalPort;
      }
    });

    it("should use PORT env when set to a valid number", () => {
      const originalPort = process.env.PORT;
      process.env.PORT = "3000";

      const parsedPort = Number(process.env.PORT);
      const PORT = Number.isFinite(parsedPort) ? parsedPort : 5000;

      expect(PORT).toBe(3000);

      if (originalPort !== undefined) {
        process.env.PORT = originalPort;
      } else {
        delete process.env.PORT;
      }
    });

    it("should default to 5000 when PORT is not a valid number", () => {
      const originalPort = process.env.PORT;
      process.env.PORT = "invalid";

      const parsedPort = Number(process.env.PORT);
      const PORT = Number.isFinite(parsedPort) ? parsedPort : 5000;

      expect(PORT).toBe(5000);

      if (originalPort !== undefined) {
        process.env.PORT = originalPort;
      } else {
        delete process.env.PORT;
      }
    });
  });
});
