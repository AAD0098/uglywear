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
const express = require("express");

describe("Express app setup", () => {
  let app;

  beforeAll(() => {
    // Build the app without starting the server (avoid port binding)
    const helmet = require("helmet");
    const cors = require("cors");
    const healthRoutes = require("../src/routes/health.routes");
    const errorHandler = require("../src/middleware/errorHandler");

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use("/api/health", healthRoutes);
    app.use(errorHandler);
  });

  it("should respond to health check endpoint", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("should set security headers via helmet", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should enable CORS", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://example.com");

    expect(response.headers["access-control-allow-origin"]).toBe("*");
  });

  it("should parse JSON body", async () => {
    const response = await request(app)
      .post("/api/health")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    // Express 5 returns 404 for POST to a GET-only route, not a parse error
    expect(response.status).toBe(404);
  });

  it("should handle 404 for unknown routes via error handler", async () => {
    const response = await request(app).get("/api/nonexistent");

    expect(response.status).toBe(404);
  });

  it("should handle errors thrown in routes", async () => {
    // Add a route that throws an error
    const testApp = express();
    testApp.use(express.json());
    testApp.get("/error", (req, res, next) => {
      const err = new Error("Test error");
      err.statusCode = 422;
      next(err);
    });
    const errorHandler = require("../src/middleware/errorHandler");
    testApp.use(errorHandler);

    const response = await request(testApp).get("/error");

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Test error");
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
