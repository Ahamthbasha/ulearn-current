import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import studentRoutes from './routes/studentRoutes';
import instructorRoutes from './routes/instructorRoutes';
import adminRoutes from './routes/adminRoutes';

import { startMembershipExpiryJob } from './cron/membershipExpiryJob';
import { initializeSocketIO } from './sockets/socketServer';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 5000;

const corsOptions = {
  credentials: true,
  origin: String(process.env.FRONTEND_URL), // e.g., "http://localhost:5173"
  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route Handler
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("💥 Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

const start = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    console.log(" Database connected successfully");
    
    startMembershipExpiryJob(); // Start CRON job
    console.log(" Membership expiry job started");

    const httpServer = createServer(app); // Create raw HTTP server

    // Create Socket.IO server with CORS configuration
    const io = new Server(httpServer, {
      cors: {
        origin: String(process.env.FRONTEND_URL),
        methods: ["GET", "POST"],
        credentials: true
      },
      allowEIO3: true, // Allow Engine.IO v3 clients
      transports: ['websocket', 'polling'] // Support both transports
    });

    // Initialize Socket.IO with the created server
    await initializeSocketIO(io);
    console.log(" Socket.IO initialized successfully");

    httpServer.listen(port, () => {
      console.log(` Server is running on port ${port}`);
      console.log(` Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(` Socket.IO is ready for connections`);
    });

  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

start();