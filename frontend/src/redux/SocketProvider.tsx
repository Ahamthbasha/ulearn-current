import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URI } from "../utils/constants"; 

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext).socket;

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log(":inside socket context")
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URI, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path : "/socket.io",
      reconnection: true, 
      reconnectionAttempts: 5, 
      reconnectionDelay: 1000, 
    });

    // Connection established
    socketInstance.on("connect", () => {
      console.log("Connected to socket:", socketInstance.id);
      console.log("instance......" ,socketInstance)
      setSocket(socketInstance);
    });


    // Disconnected
    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from socket:", reason);
      setSocket(null);
    });

    // Reconnection attempt
    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`Reconnection attempt #${attempt}`);
    });

    // Reconnection failed
    socketInstance.on("reconnect_failed", () => {
      console.error("Reconnection failed");
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection...");
      socketInstance.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;