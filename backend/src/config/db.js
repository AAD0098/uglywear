const { PrismaClient } = require("@prisma/client");
const AppError = require("../utils/AppError");

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    throw AppError.internal(`Database connection failed: ${error.message}`);
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("Error disconnecting from database:", error);
  }
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
