const express = require("express");
const { prisma } = require("../config/db");
const { asyncHandler, AppError, ApiResponse, paginate } = require("../utils");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueAll,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingOrders,
      lowStockProducts,
      ordersByStatus,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "PAID" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "PAID", createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "PAID", createdAt: { gte: weekAgo } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "PAID", createdAt: { gte: monthAgo } } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, take: 10, orderBy: { stock: "asc" } }),
      prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, email: true } }, items: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = topProductIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: topProductIds } } })
      : [];

    const topSellingProducts = topProducts.map((tp) => {
      const product = topProductDetails.find((p) => p.id === tp.productId);
      return { ...product, totalSold: tp._sum.quantity };
    });

    const statusCounts = {};
    for (const entry of ordersByStatus) {
      statusCounts[entry.status] = entry._count.id;
    }

    ApiResponse.success(res, {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: Number(revenueAll._sum.totalAmount || 0),
      revenueToday: Number(revenueToday._sum.totalAmount || 0),
      revenueWeek: Number(revenueWeek._sum.totalAmount || 0),
      revenueMonth: Number(revenueMonth._sum.totalAmount || 0),
      pendingOrders,
      lowStockProducts,
      ordersByStatus: statusCounts,
      recentOrders,
      topSellingProducts,
    });
  }),
);

// ─── User Management ─────────────────────────────────────────────────────────

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
    if (req.query.role) {
      where.role = req.query.role;
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
          phone: true,
          role: true,
          isVerified: true,
          loyaltyPoints: true,
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
    const validRoles = ["CUSTOMER", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "MARKETING_MANAGER", "FINANCE_MANAGER", "SUPPORT_AGENT"];

    if (!role || !validRoles.includes(role)) {
      throw AppError.badRequest(`Role must be one of: ${validRoles.join(", ")}`);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("User not found");
    if (user.id === req.user.id) throw AppError.badRequest("Cannot change your own role");

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true },
    });

    ApiResponse.success(res, updated);
  }),
);

// ─── Category Management ─────────────────────────────────────────────────────

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      include: { children: true, _count: { select: { products: true } } },
      where: { parentId: null },
      orderBy: { name: "asc" },
    });
    ApiResponse.success(res, categories);
  }),
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const { name, description, image, parentId } = req.body;
    if (!name) throw AppError.badRequest("Name is required");

    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
    const category = await prisma.category.create({
      data: { name, slug, description, image, parentId },
    });
    ApiResponse.created(res, category);
  }),
);

router.put(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, image, parentId } = req.body;
    const data = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
    }
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (parentId !== undefined) data.parentId = parentId;

    const category = await prisma.category.update({ where: { id }, data });
    ApiResponse.success(res, category);
  }),
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    ApiResponse.noContent(res);
  }),
);

// ─── Inventory Management ────────────────────────────────────────────────────

router.get(
  "/inventory",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const logs = await prisma.inventoryLog.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } },
    });
    const total = await prisma.inventoryLog.count();
    ApiResponse.paginated(res, { data: logs, page, limit, total });
  }),
);

router.post(
  "/inventory",
  asyncHandler(async (req, res) => {
    const { productId, warehouseId, type, quantity, note } = req.body;
    if (!productId || !type || !quantity) {
      throw AppError.badRequest("productId, type, and quantity are required");
    }

    const log = await prisma.inventoryLog.create({
      data: { productId, warehouseId, type, quantity: Number(quantity), note },
    });

    const stockChange = type === "STOCK_IN" ? Number(quantity) : -Number(quantity);
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: stockChange } },
    });

    ApiResponse.created(res, log);
  }),
);

router.get(
  "/warehouses",
  asyncHandler(async (req, res) => {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
    ApiResponse.success(res, warehouses);
  }),
);

router.post(
  "/warehouses",
  asyncHandler(async (req, res) => {
    const { name, location } = req.body;
    if (!name || !location) throw AppError.badRequest("Name and location are required");
    const warehouse = await prisma.warehouse.create({ data: { name, location } });
    ApiResponse.created(res, warehouse);
  }),
);

// ─── Coupon Management ───────────────────────────────────────────────────────

router.get(
  "/coupons",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { usages: true } } },
      }),
      prisma.coupon.count(),
    ]);
    ApiResponse.paginated(res, { data: coupons, page, limit, total });
  }),
);

router.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const { code, type, scope, value, minOrderValue, maxDiscount, usageLimit, usageLimitPerCustomer, startDate, endDate } = req.body;
    if (!code || !type || !value || !startDate || !endDate) {
      throw AppError.badRequest("code, type, value, startDate, and endDate are required");
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) throw AppError.conflict("Coupon code already exists");

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        scope: scope || "ALL",
        value: Number(value),
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usageLimitPerCustomer: usageLimitPerCustomer ? Number(usageLimitPerCustomer) : 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    ApiResponse.created(res, coupon);
  }),
);

router.put(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive, value, minOrderValue, maxDiscount, usageLimit, endDate } = req.body;
    const data = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (value !== undefined) data.value = Number(value);
    if (minOrderValue !== undefined) data.minOrderValue = Number(minOrderValue);
    if (maxDiscount !== undefined) data.maxDiscount = Number(maxDiscount);
    if (usageLimit !== undefined) data.usageLimit = Number(usageLimit);
    if (endDate !== undefined) data.endDate = new Date(endDate);

    const coupon = await prisma.coupon.update({ where: { id }, data });
    ApiResponse.success(res, coupon);
  }),
);

router.delete(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    ApiResponse.noContent(res);
  }),
);

// ─── Invoice Management ──────────────────────────────────────────────────────

router.get(
  "/invoices",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { order: { include: { user: { select: { fullName: true, email: true } } } } },
      }),
      prisma.invoice.count(),
    ]);
    ApiResponse.paginated(res, { data: invoices, page, limit, total });
  }),
);

router.post(
  "/invoices/:orderId",
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw AppError.notFound("Order not found");

    const existing = await prisma.invoice.findUnique({ where: { orderId } });
    if (existing) throw AppError.conflict("Invoice already exists for this order");

    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shippingCost,
        tax: order.tax,
        total: order.totalAmount,
        paidAt: order.paymentStatus === "PAID" ? new Date() : null,
      },
    });

    ApiResponse.created(res, invoice);
  }),
);

// ─── Order Management (enhanced) ────────────────────────────────────────────

router.get(
  "/orders/:id/timeline",
  asyncHandler(async (req, res) => {
    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    ApiResponse.success(res, timeline);
  }),
);

router.post(
  "/orders/:id/refund",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw AppError.notFound("Order not found");
    if (!amount || Number(amount) <= 0) throw AppError.badRequest("Valid amount is required");

    const refund = await prisma.refund.create({
      data: { orderId: id, amount: Number(amount), reason },
    });

    await prisma.order.update({
      where: { id },
      data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
    });

    await prisma.orderTimeline.create({
      data: { orderId: id, status: "REFUNDED", note: `Refund of ৳${amount}: ${reason || "No reason"}` },
    });

    ApiResponse.created(res, refund);
  }),
);

// ─── Shipping Management ─────────────────────────────────────────────────────

router.get(
  "/shipping/zones",
  asyncHandler(async (req, res) => {
    const zones = await prisma.shippingZone.findMany({ orderBy: { name: "asc" } });
    ApiResponse.success(res, zones);
  }),
);

router.post(
  "/shipping/zones",
  asyncHandler(async (req, res) => {
    const { name, type, regions, rate, freeAbove } = req.body;
    if (!name || rate === undefined) throw AppError.badRequest("Name and rate are required");
    const zone = await prisma.shippingZone.create({
      data: { name, type: type || "DOMESTIC", regions: regions || [], rate: Number(rate), freeAbove: freeAbove ? Number(freeAbove) : null },
    });
    ApiResponse.created(res, zone);
  }),
);

router.put(
  "/shipping/zones/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, type, regions, rate, freeAbove, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (regions !== undefined) data.regions = regions;
    if (rate !== undefined) data.rate = Number(rate);
    if (freeAbove !== undefined) data.freeAbove = Number(freeAbove);
    if (isActive !== undefined) data.isActive = isActive;

    const zone = await prisma.shippingZone.update({ where: { id }, data });
    ApiResponse.success(res, zone);
  }),
);

router.get(
  "/shipping/couriers",
  asyncHandler(async (req, res) => {
    const couriers = await prisma.courier.findMany({ orderBy: { name: "asc" } });
    ApiResponse.success(res, couriers);
  }),
);

router.post(
  "/shipping/couriers",
  asyncHandler(async (req, res) => {
    const { name, trackingUrl } = req.body;
    if (!name) throw AppError.badRequest("Name is required");
    const courier = await prisma.courier.create({ data: { name, trackingUrl } });
    ApiResponse.created(res, courier);
  }),
);

// ─── Marketing ───────────────────────────────────────────────────────────────

router.get(
  "/banners",
  asyncHandler(async (req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
    ApiResponse.success(res, banners);
  }),
);

router.post(
  "/banners",
  asyncHandler(async (req, res) => {
    const { title, image, link, position, startDate, endDate } = req.body;
    if (!title || !image) throw AppError.badRequest("Title and image are required");
    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link,
        position: position || "HERO",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    ApiResponse.created(res, banner);
  }),
);

router.put(
  "/banners/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, image, link, position, isActive, startDate, endDate } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (image !== undefined) data.image = image;
    if (link !== undefined) data.link = link;
    if (position !== undefined) data.position = position;
    if (isActive !== undefined) data.isActive = isActive;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);

    const banner = await prisma.banner.update({ where: { id }, data });
    ApiResponse.success(res, banner);
  }),
);

router.delete(
  "/banners/:id",
  asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    ApiResponse.noContent(res);
  }),
);

router.get(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    ApiResponse.success(res, campaigns);
  }),
);

router.post(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const { name, type, subject, content, audience, scheduledAt } = req.body;
    if (!name || !type) throw AppError.badRequest("Name and type are required");
    const campaign = await prisma.campaign.create({
      data: { name, type, subject, content, audience, scheduledAt: scheduledAt ? new Date(scheduledAt) : null },
    });
    ApiResponse.created(res, campaign);
  }),
);

router.get(
  "/flash-sales",
  asyncHandler(async (req, res) => {
    const sales = await prisma.flashSale.findMany({ orderBy: { startDate: "desc" } });
    ApiResponse.success(res, sales);
  }),
);

router.post(
  "/flash-sales",
  asyncHandler(async (req, res) => {
    const { name, discount, productIds, startDate, endDate } = req.body;
    if (!name || !discount || !startDate || !endDate) {
      throw AppError.badRequest("name, discount, startDate, and endDate are required");
    }
    const sale = await prisma.flashSale.create({
      data: { name, discount: Number(discount), productIds: productIds || [], startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    ApiResponse.created(res, sale);
  }),
);

// ─── Transactions & Payments ─────────────────────────────────────────────────

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { id: true, user: { select: { fullName: true } } } } },
      }),
      prisma.transaction.count(),
    ]);
    ApiResponse.paginated(res, { data: transactions, page, limit, total });
  }),
);

router.get(
  "/refunds",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { order: { include: { user: { select: { fullName: true, email: true } } } } },
      }),
      prisma.refund.count(),
    ]);
    ApiResponse.paginated(res, { data: refunds, page, limit, total });
  }),
);

// ─── Reports ─────────────────────────────────────────────────────────────────

router.get(
  "/reports/sales",
  asyncHandler(async (req, res) => {
    const { period = "30" } = req.query;
    const days = Number(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, paymentStatus: "PAID" },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailySales = {};
    for (const order of orders) {
      const date = order.createdAt.toISOString().split("T")[0];
      dailySales[date] = (dailySales[date] || 0) + Number(order.totalAmount);
    }

    ApiResponse.success(res, {
      period: days,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      totalOrders: orders.length,
      dailySales,
    });
  }),
);

router.get(
  "/reports/products",
  asyncHandler(async (req, res) => {
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 20,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    const result = topProducts.map((tp) => {
      const product = products.find((p) => p.id === tp.productId);
      return {
        ...product,
        totalSold: tp._sum.quantity,
        totalRevenue: Number(tp._sum.totalPrice),
      };
    });

    ApiResponse.success(res, result);
  }),
);

// ─── Settings ────────────────────────────────────────────────────────────────

router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const { group } = req.query;
    const where = group ? { group } : {};
    const settings = await prisma.setting.findMany({ where, orderBy: { key: "asc" } });
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    ApiResponse.success(res, settingsMap);
  }),
);

router.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      throw AppError.badRequest("Settings object is required");
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), group: req.body.group || "general" },
      });
    }

    ApiResponse.success(res, { message: "Settings updated" });
  }),
);

// ─── Activity Log ────────────────────────────────────────────────────────────

router.get(
  "/activity",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      prisma.activityLog.count(),
    ]);
    ApiResponse.paginated(res, { data: logs, page, limit, total });
  }),
);

// ─── Gift Cards ──────────────────────────────────────────────────────────────

router.get(
  "/gift-cards",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const [cards, total] = await Promise.all([
      prisma.giftCard.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      prisma.giftCard.count(),
    ]);
    ApiResponse.paginated(res, { data: cards, page, limit, total });
  }),
);

router.post(
  "/gift-cards",
  asyncHandler(async (req, res) => {
    const { balance, userId, expiresAt } = req.body;
    if (!balance) throw AppError.badRequest("Balance is required");

    const code = `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const card = await prisma.giftCard.create({
      data: {
        code,
        balance: Number(balance),
        initialAmt: Number(balance),
        userId: userId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    ApiResponse.created(res, card);
  }),
);

// ─── Support Tickets ─────────────────────────────────────────────────────────

router.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    const { skip, take, page, limit } = paginate(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    ApiResponse.paginated(res, { data: tickets, page, limit, total });
  }),
);

router.patch(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, priority } = req.body;
    const data = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    const ticket = await prisma.supportTicket.update({ where: { id }, data });
    ApiResponse.success(res, ticket);
  }),
);

module.exports = router;
