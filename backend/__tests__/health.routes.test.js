const express = require("express");
const request = require("supertest");

jest.mock("../src/config/db", () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

const healthRoutes = require("../src/routes/health.routes");

describe("GET /api/health", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use("/api/health", healthRoutes);
  });

  it("should return 200 status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
  });

  it("should return status 'ok'", async () => {
    const response = await request(app).get("/api/health");

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

  it("should return a recent timestamp", async () => {
    const before = new Date();
    const response = await request(app).get("/api/health");
    const after = new Date();

    const responseTime = new Date(response.body.time);
    expect(responseTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(responseTime.getTime()).toBeLessThanOrEqual(after.getTime());
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
