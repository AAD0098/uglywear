const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { asyncHandler, AppError, ApiResponse } = require("../utils");
const { authenticate, generateToken } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      throw AppError.badRequest("Email, password, and fullName are required");
    }

    if (password.length < 8) {
      throw AppError.badRequest("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    const token = generateToken(user);
    ApiResponse.created(res, { user, token });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw AppError.badRequest("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = generateToken(user);
    ApiResponse.success(res, {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    });
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    ApiResponse.success(res, user);
  }),
);

module.exports = router;
