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

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw AppError.badRequest("Order must contain at least one item");
    }

    const validMethods = ["CASH_ON_DELIVERY", "CARD", "BKASH", "NAGAD"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      throw AppError.badRequest(`paymentMethod must be one of: ${validMethods.join(", ")}`);
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw AppError.badRequest("One or more products not found or inactive");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (item.quantity < 1) {
        throw AppError.badRequest("Quantity must be at least 1");
      }
      if (product.stock < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for "${product.name}"`);
      }
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const shippingCost = subtotal >= 1000 ? 0 : 60;
    const totalAmount = subtotal + shippingCost;

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          userId: req.user.id,
          paymentMethod,
          subtotal,
          shippingCost,
          totalAmount,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      });
    });

    ApiResponse.created(res, order);
  }),
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const where = req.user.role === "ADMIN" ? {} : { userId: req.user.id };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } }, user: { select: { id: true, fullName: true, email: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    ApiResponse.paginated(res, { data: orders, page, limit, total });
  }),
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } }, user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!order) {
      throw AppError.notFound("Order not found");
    }

    if (req.user.role !== "ADMIN" && order.userId !== req.user.id) {
      throw AppError.forbidden("Not authorized to view this order");
    }

    ApiResponse.success(res, order);
  }),
);

router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!status || !validStatuses.includes(status)) {
      throw AppError.badRequest(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      throw AppError.notFound("Order not found");
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: { include: { product: true } } },
    });

    ApiResponse.success(res, updated);
  }),
);

module.exports = router;
