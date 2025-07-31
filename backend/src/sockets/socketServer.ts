import * as cookie from 'cookie';
import dotenv from "dotenv";
import { JwtService } from '../utils/jwt';
dotenv.config();

import { Server, Socket } from "socket.io";
//server - socket.io server instance
//socket - individual client connection
import studentCollection from "../models/userModel";
import instructorCollection from "../models/instructorModel";

interface OnlineUser {
  id: string;
  userId: string;
  socketId: string;
  lastActive: number;
  role?: string; // Add role to track user type
}

interface DecodedToken {
  email: string;
  role: string;
  [key: string]: any;
}

// it follows a singleton pattern.instance hold the single instance of the socket Manager.
class SocketManager {
  private static instance: SocketManager;
  private onlineUsers: Map<string, OnlineUser> = new Map();

  private constructor() {
    // Clean up inactive users every 30 minutes
    setInterval(() => this.cleanupInactiveUsers(), 1000 * 60 * 30);
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public addUser(id: string, userId: string, socketId: string, role?: string): void {
    this.onlineUsers.set(userId, {
      id,
      userId,
      socketId,
      lastActive: Date.now(),
      role,
    });
  }

  public removeUser(userId: string): void {
    this.onlineUsers.delete(userId);
  }

  public getUserSocketId(userId: string): string | undefined {
    return this.onlineUsers.get(userId)?.socketId;
  }

  public getUserSocketIdByUserId(email: string): OnlineUser | undefined {
    return this.onlineUsers.get(email);
  }

  public getAllOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  private cleanupInactiveUsers(maxInactivityTime = 1000 * 60 * 30): void {
    const now = Date.now();
    this.onlineUsers.forEach((user, userId) => {
      if (now - user.lastActive > maxInactivityTime) {
        this.onlineUsers.delete(userId);
      }
    });
  }
}



//initialize the socket.io server

async function initializeSocketIO(io: Server) {
  console.log("Initializing Socket.IO");
  const socketManager = SocketManager.getInstance();

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = extractToken(socket);
      const jwtService = new JwtService()
      const JWT_SECRET = process.env.JWT_SECRET || "MYLIFEMYRULE";
      if (!JWT_SECRET) {
        throw new Error("JWT Secret not configured");
      }
  
      const decodedToken = await jwtService.verifyToken(token) as DecodedToken;
      if (!decodedToken?.email || !decodedToken?.role) {
        throw new Error("Invalid or malformed token");
      }
  
      let entity;
      if (decodedToken.role === "student") {
        entity = await studentCollection.findOne({ email: decodedToken.email });
      } else if (decodedToken.role === "instructor") {
        entity = await instructorCollection.findOne({ email: decodedToken.email });
      } else {
        throw new Error("Invalid role in token");
      }
  
      if (!entity) {
        throw new Error("Entity not found");
      }
  
      socket.data.entity = entity;
      socket.data.email = decodedToken.email;
      socket.data.role = decodedToken.role;
      next();
    } catch (error: any) {
      console.error("Authentication error:", error.message);
      next(new Error(error.message || "Authentication failed"));
    }
  });
  
  // Main connection handler
  io.on("connection", (socket) => {
    console.log(`${socket.data.role} connected: ${socket.id}, Email: ${socket.data.email}`);
    
    // Add user to online users
    socketManager.addUser(
      String(socket.data.entity._id), 
      socket.data.entity.email, 
      socket.id,
      socket.data.role
    );

    // Emit user online status.It announcing the user's online status with their email and role
    socket.broadcast.emit("user:online", {
      email: socket.data.email,
      role: socket.data.role
    });
  
    // Initiate outgoing call
    socket.on("outgoing:call", (data) => {
      const { to, fromOffer } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);
      
      if (!recipientSocketId) {
        socket.emit("call:error", { 
          message: `User ${to} is not online`, 
          code: "USER_OFFLINE" 
        });
        return;
      }
  
      // Log the call initiation
      console.log(`${socket.data.role} (${socket.data.email}) initiating call to ${to}`);
  
      // Send incoming call to recipient
      io.to(recipientSocketId.socketId).emit("incoming:call", { 
        from: socket.data.email,  // Send caller's email
        fromRole: socket.data.role, // Send caller's role
        offer: fromOffer, 
        userEmail: recipientSocketId.userId 
      });
    });
  
    // Handle call acceptance
    socket.on("call:accepted", (data) => {
      const { to, answer } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);
      
      if (recipientSocketId) {
        console.log(`Call accepted between ${socket.data.email} and ${to}`);
        
        io.to(recipientSocketId.socketId).emit("incoming:answer", { 
          from: socket.data.email,  // Send caller's email
          fromRole: socket.data.role, // Send caller's role
          answer 
        });
      }
    });
  
    // Handle ICE candidate exchange
    socket.on("ice:candidate", (data) => {
      const { to, candidate } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId.socketId).emit("ice:candidate", { 
          from: socket.data.email,  // Send sender's email
          candidate 
        });
      }
    });
  
    // Handle call termination
    socket.on("end:call", (data) => {
      const { to } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);
      
      if (recipientSocketId) {
        console.log(`Call ended between ${socket.data.email} and ${to}`);
        
        io.to(recipientSocketId.socketId).emit("call:ended", { 
          from: socket.data.email,  // Send terminator's email
          fromRole: socket.data.role // Send terminator's role
        });
      }
    });

    // Handle call rejection
    socket.on("call:rejected", (data) => {
      const { to } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);
      
      if (recipientSocketId) {
        console.log(`Call rejected by ${socket.data.email} from ${to}`);
        
        io.to(recipientSocketId.socketId).emit("call:rejected", { 
          from: socket.data.email,
          fromRole: socket.data.role
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`${socket.data.role} disconnected: ${socket.id}, Email: ${socket.data.email}`);
      socketManager.removeUser(socket.data.entity.email);
      
      // Emit user offline status
      socket.broadcast.emit("user:offline", {
        email: socket.data.email,
        role: socket.data.role
      });
    });
  });
}
  
// Token extraction utility
function extractToken(socket: Socket): string {
  const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
  
  // Check for different access tokens based on role
  const token = 
    cookies.accessToken || 
    socket.handshake.auth?.token
  
  if (!token) {
    throw new Error("No authentication token provided");
  }
  return token;
}
  
export { initializeSocketIO, SocketManager };