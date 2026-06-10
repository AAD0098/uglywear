const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    throw new Error(`Database connection error: ${error.message}`);
  }
};

module.exports = {
  prisma,
  connectDB,
};
