jest.mock("@prisma/client", () => {
  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const express = require("express");
const request = require("supertest");

jest.mock("../src/config/db", () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

const healthRoutes = require("../src/routes/health.routes");
const { prisma } = require("../src/config/db");

describe("GET /api/health", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use("/api/health", healthRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when database is reachable", () => {
    beforeEach(() => {
      prisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    });

    it("should return 200 status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
    });

    it("should return success: true with status 'ok'", async () => {
      const response = await request(app).get("/api/health");

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("ok");
    });

    it("should return a valid ISO time string", async () => {
      const response = await request(app).get("/api/health");

      expect(response.body.time).toBeDefined();
      const parsedDate = new Date(response.body.time);
      expect(parsedDate.toISOString()).toBe(response.body.time);
    });

    it("should return JSON content type", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("when database is unreachable", () => {
    beforeEach(() => {
      prisma.$queryRaw.mockRejectedValueOnce(new Error("DB unreachable"));
    });

    it("should return 503 status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(503);
    });

    it("should return degraded status with message", async () => {
      const response = await request(app).get("/api/health");

      expect(response.body.success).toBe(false);
      expect(response.body.status).toBe("degraded");
      expect(response.body.message).toBe("Database unreachable");
    });
  });

  it("should return 503 when database is unreachable", async () => {
    const { prisma } = require("../src/config/db");
    prisma.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body.status).toBe("degraded");
    expect(response.body.message).toBe("Database unreachable");
  });
});
