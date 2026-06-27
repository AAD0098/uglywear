const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { AppError, asyncHandler } = require("../utils");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid authorization header");
  }

  const token = header.split(" ")[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw AppError.unauthorized("User no longer exists");
  }

  req.user = user;
  next();
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    throw AppError.forbidden("Admin access required");
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { authenticate, requireAdmin, generateToken };
