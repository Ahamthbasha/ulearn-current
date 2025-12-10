import dotenv from "dotenv";

if (process.env.NODE_ENV === "production") {
  dotenv.config();
} else {
  dotenv.config({ path: ".env.development" });
}

import express from "express";
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
import { StatusCode } from "./utils/enums";
import { errorHandler } from "./middlewares/errorHandler";

// Import the socket types
interface Entity {
  _id: string;
  email: string;
  [key: string]: unknown;
}

interface SocketData {
  entity: Entity;
  email: string;
  role: string;
}

interface RTCSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

interface OutgoingCallData {
  to: string;
  fromOffer: RTCSessionDescriptionInit;
}

interface CallAcceptedData {
  to: string;
  answer: RTCSessionDescriptionInit;
}

interface IceCandidateData {
  to: string;
  candidate: RTCIceCandidateInit;
}

interface EndCallData {
  to: string;
}

interface CallRejectedData {
  to: string;
}

interface ClientToServerEvents {
  "outgoing:call": (data: OutgoingCallData) => void;
  "call:accepted": (data: CallAcceptedData) => void;
  "ice:candidate": (data: IceCandidateData) => void;
  "end:call": (data: EndCallData) => void;
  "call:rejected": (data: CallRejectedData) => void;
}

interface ServerToClientEvents {
  "user:online": (data: { email: string; role: string }) => void;
  "user:offline": (data: { email: string; role: string }) => void;
  "call:error": (data: { message: string; code: string }) => void;
  "incoming:call": (data: {
    from: string;
    fromRole: string;
    offer: RTCSessionDescriptionInit;
    userEmail: string;
  }) => void;
  "incoming:answer": (data: {
    from: string;
    fromRole: string;
    answer: RTCSessionDescriptionInit;
  }) => void;
  "ice:candidate": (data: {
    from: string;
    candidate: RTCIceCandidateInit;
  }) => void;
  "call:ended": (data: { from: string; fromRole: string }) => void;
  "call:rejected": (data: { from: string; fromRole: string }) => void;
}

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    appLogger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const port: number = Number(process.env.PORT) || 3000;

// Filter only valid string origins
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL ?? "https://ulearnfrontend.onrender.com",
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
  res.status(StatusCode.NOT_FOUND).json({
    success: false,
    message: "API route not found",
  });
});

app.use(errorHandler);

// Process-level error logging
process.on("unhandledRejection", (reason: unknown) => {
  const errorDetails =
    reason instanceof Error
      ? { message: reason.message, stack: reason.stack }
      : { reason: String(reason) };
  appLogger.error("Unhandled Promise Rejection", errorDetails);
});

process.on("uncaughtException", (error: Error) => {
  appLogger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

const start = async (): Promise<void> => {
  try {
    await connectDB();
    appLogger.info("Database connected successfully");

    try {
      await redisClient.ping();
      appLogger.info("Redis connected successfully");
    } catch (redisError: unknown) {
      const errorMessage =
        redisError instanceof Error
          ? redisError.message
          : "Unknown Redis error";
      appLogger.warn(
        "Redis connection failed, OTP functionality may be limited",
        { error: errorMessage },
      );
    }

    startMembershipExpiryJob();
    appLogger.info("Membership expiry job started");

    const httpServer = createServer(app);

    // Create typed Socket.IO server
    const io = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      SocketData
    >(httpServer, {
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
        `HTTP request logging enabled (${process.env.NODE_ENV || "development"} mode)`,
      );
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error starting server";
    appLogger.error("Failed to start server", { error: errorMessage });
    process.exit(1);
  }
};

start();
