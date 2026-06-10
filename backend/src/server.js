require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const { connectDB } = require("./config/db");
const healthRoutes = require("./routes/health.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);

app.use(errorHandler);

const parsedPort = Number(process.env.PORT);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`UGLYWEAR backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
};

startServer();
