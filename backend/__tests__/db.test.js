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
const { prisma, connectDB, disconnectDB } = require("../src/config/db");

describe("db config", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

    it("should log success message on connection", async () => {
      prisma.$connect.mockResolvedValueOnce(undefined);

      await connectDB();

      expect(console.log).toHaveBeenCalledWith("Database connected");
    });

    it("should throw an AppError when connection fails", async () => {
      const dbError = new Error("Connection refused");
      prisma.$connect.mockRejectedValueOnce(dbError);

      await expect(connectDB()).rejects.toThrow("Database connection failed");
    });

    it("should include the original error message in the thrown error", async () => {
      const dbError = new Error("ECONNREFUSED");
      prisma.$connect.mockRejectedValueOnce(dbError);

      await expect(connectDB()).rejects.toThrow(
        "Database connection failed: ECONNREFUSED",
      );
    });
  });

  describe("disconnectDB", () => {
    it("should call prisma.$disconnect successfully", async () => {
      prisma.$disconnect.mockResolvedValueOnce(undefined);

      await disconnectDB();

      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("Database disconnected");
    });

    it("should handle disconnect errors gracefully", async () => {
      const dbError = new Error("Disconnect failed");
      prisma.$disconnect.mockRejectedValueOnce(dbError);

      await disconnectDB();

      expect(console.error).toHaveBeenCalledWith(
        "Error disconnecting from database:",
        dbError,
      );
    });
  });
});
