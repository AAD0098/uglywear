const express = require("express");
const { prisma } = require("../config/db");
const {
  asyncHandler,
  AppError,
  ApiResponse,
  paginate,
} = require("../utils");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const where = {};

    if (req.query.includeInactive !== "true") {
      where.isActive = true;
    }

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: "insensitive" } },
        { description: { contains: req.query.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    ApiResponse.paginated(res, { data: products, page, limit, total });
  }),
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
    });
    if (!product) {
      throw AppError.notFound("Product not found");
    }
    ApiResponse.success(res, product);
  }),
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, price, stock } = req.body;

    if (!name || price === undefined) {
      throw AppError.badRequest("Name and price are required");
    }

    if (Number(price) < 0) {
      throw AppError.badRequest("Price must be non-negative");
    }

    let slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: Number(price),
        stock: stock !== undefined ? Number(stock) : 0,
      },
    });

    ApiResponse.created(res, product);
  }),
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, isActive } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound("Product not found");
    }

    const data = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = slugify(name);
      const slugConflict = await prisma.product.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugConflict) {
        data.slug = `${data.slug}-${Date.now()}`;
      }
    }
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (stock !== undefined) data.stock = Number(stock);
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({ where: { id }, data });
    ApiResponse.success(res, product);
  }),
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound("Product not found");
    }

    await prisma.product.delete({ where: { id } });
    ApiResponse.noContent(res);
  }),
);

module.exports = router;
