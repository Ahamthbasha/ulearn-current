import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

import studentRoutes from "./routes/studentRoutes";
import instructorRoutes from "./routes/instructorRoutes";
import adminRoutes from "./routes/adminRoutes";

import { startMembershipExpiryJob } from "./cron/membershipExpiryJob";
import { initializeSocketIO } from "./sockets/socketServer";
import { appLogger, accessLogStream } from "./utils/logger";

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3000;

const corsOptions = {
  credentials: true,
  origin: [
    String(process.env.FRONTEND_URL),
    "http://localhost:5173",
    "https://6964887265b9.ngrok-free.app",
  ],
  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
};

// Morgan HTTP request logging
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

// 404 Handler
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global Error Handler
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

// Process-level Error Logging
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

    startMembershipExpiryJob();
    appLogger.info("Membership expiry job started");

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: [
          String(process.env.FRONTEND_URL),
          "https://6964887265b9.ngrok-free.app",
        ],
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
      appLogger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
      appLogger.info(`Socket.IO is ready for connections`);
      appLogger.info(
        `HTTP request logging enabled (${process.env.NODE_ENV || "development"} mode)`,
      );
    });
  } catch (error) {
    appLogger.error("Failed to start server", { error });
    process.exit(1);
  }
};

start();
