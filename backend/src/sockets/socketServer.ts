import * as cookie from "cookie";
import dotenv from "dotenv";
import { JwtService } from "../utils/jwt";
dotenv.config();

import { Server, Socket } from "socket.io";
import studentCollection from "../models/userModel";
import instructorCollection from "../models/instructorModel";

interface OnlineUser {
  id: string;
  userId: string;
  socketId: string;
  lastActive: number;
  role?: string;
}

interface DecodedToken {
  email: string;
  role: string;
  [key: string]: unknown;
}

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

// Define WebRTC types for Node.js environment
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

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

class SocketManager {
  private static instance: SocketManager;
  private onlineUsers: Map<string, OnlineUser> = new Map();

  private constructor() {
    setInterval(() => this.cleanupInactiveUsers(), 1000 * 60 * 30);
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public addUser(
    id: string,
    userId: string,
    socketId: string,
    role?: string,
  ): void {
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

async function initializeSocketIO(io: TypedServer): Promise<void> {
  const socketManager = SocketManager.getInstance();

  io.use(async (socket: Socket, next) => {
    try {
      const token = extractToken(socket);
      const jwtService = new JwtService();
      const JWT_SECRET = process.env.JWT_SECRET || "MYLIFEMYRULE";
      
      if (!JWT_SECRET) {
        throw new Error("JWT Secret not configured");
      }

      const decodedToken = (await jwtService.verifyToken(
        token,
      )) as DecodedToken;
      
      if (!decodedToken?.email || !decodedToken?.role) {
        throw new Error("Invalid or malformed token");
      }

      let entity: Entity | null = null;
      
      if (decodedToken.role === "student") {
        entity = await studentCollection.findOne({ email: decodedToken.email }) as Entity | null;
      } else if (decodedToken.role === "instructor") {
        entity = await instructorCollection.findOne({
          email: decodedToken.email,
        }) as Entity | null;
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      next(new Error(errorMessage));
    }
  });

  io.on("connection", (socket: TypedSocket) => {
    socketManager.addUser(
      String(socket.data.entity._id),
      socket.data.entity.email,
      socket.id,
      socket.data.role,
    );

    socket.broadcast.emit("user:online", {
      email: socket.data.email,
      role: socket.data.role,
    });

    socket.on("outgoing:call", (data: OutgoingCallData) => {
      const { to, fromOffer } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);

      if (!recipientSocketId) {
        socket.emit("call:error", {
          message: `User ${to} is not online`,
          code: "USER_OFFLINE",
        });
        return;
      }

      io.to(recipientSocketId.socketId).emit("incoming:call", {
        from: socket.data.email,
        fromRole: socket.data.role,
        offer: fromOffer,
        userEmail: recipientSocketId.userId,
      });
    });

    socket.on("call:accepted", (data: CallAcceptedData) => {
      const { to, answer } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);

      if (recipientSocketId) {
        io.to(recipientSocketId.socketId).emit("incoming:answer", {
          from: socket.data.email,
          fromRole: socket.data.role,
          answer,
        });
      }
    });

    socket.on("ice:candidate", (data: IceCandidateData) => {
      const { to, candidate } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);

      if (recipientSocketId) {
        io.to(recipientSocketId.socketId).emit("ice:candidate", {
          from: socket.data.email,
          candidate,
        });
      }
    });

    socket.on("end:call", (data: EndCallData) => {
      const { to } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);

      if (recipientSocketId) {
        io.to(recipientSocketId.socketId).emit("call:ended", {
          from: socket.data.email,
          fromRole: socket.data.role,
        });
      }
    });

    socket.on("call:rejected", (data: CallRejectedData) => {
      const { to } = data;
      const recipientSocketId = socketManager.getUserSocketIdByUserId(to);

      if (recipientSocketId) {
        io.to(recipientSocketId.socketId).emit("call:rejected", {
          from: socket.data.email,
          fromRole: socket.data.role,
        });
      }
    });

    socket.on("disconnect", () => {
      socketManager.removeUser(socket.data.entity.email);

      socket.broadcast.emit("user:offline", {
        email: socket.data.email,
        role: socket.data.role,
      });
    });
  });
}

function extractToken(socket: Socket): string {
  const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
  const token = cookies.accessToken || socket.handshake.auth?.token;

  if (!token) {
    throw new Error("No authentication token provided");
  }
  return token;
}

export { initializeSocketIO, SocketManager };