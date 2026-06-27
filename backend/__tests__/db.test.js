jest.mock("@prisma/client", () => {
  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const { PrismaClient } = require("@prisma/client");
const { prisma, connectDB } = require("../src/config/db");

describe("db config", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("prisma client", () => {
    it("should export a PrismaClient instance", () => {
      expect(PrismaClient).toHaveBeenCalledTimes(1);
      expect(prisma).toBeDefined();
      expect(prisma.$connect).toBeDefined();
    });
  });

  describe("connectDB", () => {
    it("should call prisma.$connect successfully", async () => {
      prisma.$connect.mockResolvedValueOnce(undefined);

      await expect(connectDB()).resolves.toBeUndefined();
      expect(prisma.$connect).toHaveBeenCalledTimes(1);
    });

    it("should throw an error when connection fails", async () => {
      const dbError = new Error("Connection refused");
      prisma.$connect.mockRejectedValueOnce(dbError);

      await expect(connectDB()).rejects.toThrow("Database connection failed");
    });

    it("should include the original error message in the thrown error", async () => {
      const dbError = new Error("ECONNREFUSED");
      prisma.$connect.mockRejectedValueOnce(dbError);

      await expect(connectDB()).rejects.toThrow(
        "Database connection failed: ECONNREFUSED"
      );
    });
  });
});
