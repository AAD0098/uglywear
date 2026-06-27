const express = require("express");
const { prisma } = require("../config/db");
const { asyncHandler } = require("../utils");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        success: true,
        status: "ok",
        time: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "degraded",
        time: new Date().toISOString(),
        message: "Database unreachable",
      });
    }
  })
);

module.exports = router;
