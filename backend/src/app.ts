import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import express, { Request, Response, NextFunction } from "express";
import connectDB from "./config/db";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import redisClient from "./config/redis";
import studentRoutes from "./routes/studentRoutes";
import instructorRoutes from "./routes/instructorRoutes";
import adminRoutes from "./routes/adminRoutes";
import { startMembershipExpiryJob } from "./cron/membershipExpiryJob";
import { initializeSocketIO } from "./sockets/socketServer";
import { appLogger, accessLogStream } from "./utils/logger";

// Validate critical environment variables
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "REDIS_HOST",
  "REDIS_PORT",
];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const port: number = Number(process.env.PORT) || 3000;

// Filter only valid string origins
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL ?? ""
].filter((url): url is string => Boolean(url));

const corsOptions: CorsOptions = {
  credentials: true,
  origin: allowedOrigins,
  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
};

// HTTP request logging
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev"));
}

// Middleware
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  appLogger.error("Request error", {
    statusCode,
    message,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// Process-level error logging
process.on("unhandledRejection", (reason: any) => {
  appLogger.error("Unhandled Promise Rejection", { reason });
});
process.on("uncaughtException", (error: Error) => {
  appLogger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

const start = async () => {
  try {
    await connectDB();
    appLogger.info("Database connected successfully");

    try {
      await redisClient.ping();
      appLogger.info("Redis connected successfully");
    } catch (redisError) {
      appLogger.warn("Redis connection failed, OTP functionality may be limited", { redisError });
    }

    startMembershipExpiryJob();
    appLogger.info("Membership expiry job started");

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
      allowEIO3: true,
      transports: ["websocket", "polling"],
    });

    await initializeSocketIO(io);
    appLogger.info("Socket.IO initialized successfully");

    httpServer.listen(port, () => {
      appLogger.info(`Server is running on port ${port}`);
      appLogger.info(`Frontend URLs: ${allowedOrigins.join(", ")}`);
      appLogger.info(`Socket.IO is ready for connections`);
      appLogger.info(
        `HTTP request logging enabled (${process.env.NODE_ENV || "development"} mode)`
      );
    });
  } catch (error) {
    appLogger.error("Failed to start server", { error });
    process.exit(1);
  }
};

start();