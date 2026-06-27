const express = require("express");
const { prisma } = require("../config/db");
const { asyncHandler, AppError, ApiResponse, paginate } = require("../utils");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [totalProducts, totalOrders, totalUsers, revenueResult] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: "PAID" },
        }),
      ]);

    const [recentOrders, ordersByStatus] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const statusCounts = {};
    for (const entry of ordersByStatus) {
      statusCounts[entry.status] = entry._count.id;
    }

    ApiResponse.success(res, {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: Number(revenueResult._sum.totalAmount || 0),
      recentOrders,
      ordersByStatus: statusCounts,
    });
  }),
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);

    const where = {};
    if (req.query.search) {
      where.OR = [
        { fullName: { contains: req.query.search, mode: "insensitive" } },
        { email: { contains: req.query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    ApiResponse.paginated(res, { data: users, page, limit, total });
  }),
);

router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["CUSTOMER", "ADMIN"].includes(role)) {
      throw AppError.badRequest("Role must be CUSTOMER or ADMIN");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (user.id === req.user.id) {
      throw AppError.badRequest("Cannot change your own role");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    ApiResponse.success(res, updated);
  }),
);

module.exports = router;
