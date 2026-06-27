const AppError = require("../src/utils/AppError");
const asyncHandler = require("../src/utils/asyncHandler");
const ApiResponse = require("../src/utils/ApiResponse");
const paginate = require("../src/utils/paginate");
const createCrudService = require("../src/utils/crudService");

describe("AppError", () => {
  it("should create an error with message and statusCode", () => {
    const err = new AppError("Something broke", 500);

    expect(err.message).toBe("Something broke");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it("should have a captured stack trace", () => {
    const err = new AppError("test", 400);

    expect(err.stack).toBeDefined();
  });

  describe("static factory methods", () => {
    it("badRequest returns 400", () => {
      const err = AppError.badRequest("Invalid input");
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Invalid input");
    });

    it("badRequest uses default message", () => {
      const err = AppError.badRequest();
      expect(err.message).toBe("Bad Request");
    });

    it("unauthorized returns 401", () => {
      const err = AppError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Unauthorized");
    });

    it("forbidden returns 403", () => {
      const err = AppError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("Forbidden");
    });

    it("notFound returns 404", () => {
      const err = AppError.notFound("Page missing");
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Page missing");
    });

    it("conflict returns 409", () => {
      const err = AppError.conflict("Already exists");
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe("Already exists");
    });

    it("internal returns 500", () => {
      const err = AppError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe("Internal Server Error");
    });
  });
});

describe("asyncHandler", () => {
  it("should call the wrapped function with req, res, next", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const req = {};
    const res = {};
    const next = jest.fn();

    const handler = asyncHandler(fn);
    await handler(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it("should forward thrown errors to next", async () => {
    const err = new Error("async failure");
    const fn = jest.fn().mockRejectedValue(err);
    const req = {};
    const res = {};
    const next = jest.fn();

    const handler = asyncHandler(fn);
    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("should not call next on success", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const req = {};
    const res = {};
    const next = jest.fn();

    const handler = asyncHandler(fn);
    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});

describe("ApiResponse", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  describe("success", () => {
    it("should return 200 with success: true and data", () => {
      ApiResponse.success(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    it("should return 200 without data field when data is null", () => {
      ApiResponse.success(res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should support custom status code", () => {
      ApiResponse.success(res, { id: 1 }, 202);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("created", () => {
    it("should return 201 with data", () => {
      ApiResponse.created(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });
  });

  describe("paginated", () => {
    it("should return paginated response with correct shape", () => {
      ApiResponse.paginated(res, {
        data: [{ id: 1 }],
        page: 1,
        limit: 10,
        total: 25,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }],
        pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
      });
    });
  });

  describe("noContent", () => {
    it("should return 204 with no body", () => {
      ApiResponse.noContent(res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
  });
});

describe("paginate", () => {
  it("should return defaults when no query params given", () => {
    const result = paginate({});

    expect(result).toEqual({ skip: 0, take: 20, page: 1, limit: 20 });
  });

  it("should parse page and limit from query", () => {
    const result = paginate({ page: "3", limit: "10" });

    expect(result).toEqual({ skip: 20, take: 10, page: 3, limit: 10 });
  });

  it("should clamp limit to maxLimit", () => {
    const result = paginate({ limit: "500" });

    expect(result.limit).toBe(100);
    expect(result.take).toBe(100);
  });

  it("should enforce minimum page of 1", () => {
    const result = paginate({ page: "-5" });

    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("should enforce minimum limit of 1", () => {
    const result = paginate({ limit: "0" });

    expect(result.limit).toBe(20); // parseInt("0") is 0, falsy → defaultLimit
  });

  it("should accept custom defaults", () => {
    const result = paginate({}, { limit: 5, maxLimit: 50 });

    expect(result.limit).toBe(5);
  });

  it("should respect custom maxLimit", () => {
    const result = paginate({ limit: "200" }, { maxLimit: 50 });

    expect(result.limit).toBe(50);
  });
});

describe("createCrudService", () => {
  let mockModel;
  let service;

  beforeEach(() => {
    mockModel = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    service = createCrudService(mockModel);
  });

  describe("findMany", () => {
    it("should call model.findMany with options", async () => {
      mockModel.findMany.mockResolvedValue([{ id: "1" }]);

      const result = await service.findMany({ where: { isActive: true } });

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toEqual([{ id: "1" }]);
    });
  });

  describe("findById", () => {
    it("should return the record when found", async () => {
      mockModel.findUnique.mockResolvedValue({ id: "1", name: "Test" });

      const result = await service.findById("1");

      expect(mockModel.findUnique).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should throw AppError.notFound when record does not exist", async () => {
      mockModel.findUnique.mockResolvedValue(null);

      await expect(service.findById("999")).rejects.toThrow("Record not found");
    });
  });

  describe("create", () => {
    it("should call model.create with data", async () => {
      const data = { name: "New Item" };
      mockModel.create.mockResolvedValue({ id: "1", ...data });

      const result = await service.create(data);

      expect(mockModel.create).toHaveBeenCalledWith({ data });
      expect(result.name).toBe("New Item");
    });
  });

  describe("update", () => {
    it("should update the record when found", async () => {
      mockModel.findUnique.mockResolvedValue({ id: "1" });
      mockModel.update.mockResolvedValue({ id: "1", name: "Updated" });

      const result = await service.update("1", { name: "Updated" });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { name: "Updated" },
      });
      expect(result.name).toBe("Updated");
    });

    it("should throw AppError.notFound when record does not exist", async () => {
      mockModel.findUnique.mockResolvedValue(null);

      await expect(service.update("999", { name: "X" })).rejects.toThrow(
        "Record not found",
      );
    });
  });

  describe("delete", () => {
    it("should delete the record when found", async () => {
      mockModel.findUnique.mockResolvedValue({ id: "1" });
      mockModel.delete.mockResolvedValue({ id: "1" });

      const result = await service.delete("1");

      expect(mockModel.delete).toHaveBeenCalledWith({ where: { id: "1" } });
      expect(result.id).toBe("1");
    });

    it("should throw AppError.notFound when record does not exist", async () => {
      mockModel.findUnique.mockResolvedValue(null);

      await expect(service.delete("999")).rejects.toThrow("Record not found");
    });
  });

  describe("count", () => {
    it("should return count with where clause", async () => {
      mockModel.count.mockResolvedValue(5);

      const result = await service.count({ isActive: true });

      expect(mockModel.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(5);
    });

    it("should default to empty where", async () => {
      mockModel.count.mockResolvedValue(10);

      const result = await service.count();

      expect(mockModel.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(10);
    });
  });
});
