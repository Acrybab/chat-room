// socket.ts
import { getToken } from "@/lib/cookies";
import { io, Socket } from "socket.io-client";
class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private userId: number | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
  SOCKET_URL = "https://chat-room-be-production.up.railway.app";
  getUserId = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        "https://chat-room-be-production.up.railway.app/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data?.data?.user?.id;
    } catch (error) {
      console.error("Failed to get userId:", error);
      return null;
    }
  };
  initializeSocket = async () => {
    const userId = await this.getUserId();

    if (!userId) {
      console.error("Cannot initialize socket: userId not found");
      return null;
    }

    const socket = io(this.SOCKET_URL, {
      auth: { userId }, // 👈 Quan trọng!
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected with userId:", userId);
    });

    return socket;
  };
  setUserId(userId: number) {
    console.log("🆔 Setting userId:", userId, "Previous:", this.userId);
    this.userId = userId;

    if (this.socket?.connected) {
      console.log("🔄 Socket already connected, disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket {
    if (!this.socket) {
      console.log("🔌 Creating NEW socket connection");
      console.log("📍 URL:", "https://chat-room-be-production.up.railway.app");
      console.log("👤 UserId:", this.userId);

      this.socket = io("https://chat-room-be-production.up.railway.app", {
        transports: ["websocket"],
        forceNew: true, // ✅ Force new connection
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false,
        timeout: 10000,
        auth: {
          userId: this.userId,
        },
        query: {
          userId: this.userId, // ✅ Gửi cả query param
        },
      });

      // Connection events
      this.socket.on("connect", () => {
        console.log("✅ Socket CONNECTED:", {
          socketId: this.socket?.id,
          userId: this.userId,
          timestamp: new Date().toISOString(),
        });
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Socket DISCONNECTED:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("🚫 Socket connection ERROR:", {
          message: error.message,
          userId: this.userId,
        });
      });

      // Listen for user status changes
      this.socket.on("userStatusChanged", (data) => {
        console.log("👥 User status changed:", data);
      });

      // Override emit to debug
      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = (event: string, ...args: unknown[]) => {
        console.log(`📤 Emitting:`, {
          event,
          args,
          socketId: this.socket?.id,
          userId: this.userId,
        });
        return originalEmit(event, ...args);
      };

      // Listen to ALL events for debugging
      this.socket.onAny((event, ...args) => {
        console.log(`📥 Received event:`, { event, args });
      });
    } else if (!this.socket.connected) {
      console.log("🔌 Socket exists but not connected, connecting...");
    }

    return this.socket;
  }

  reconnectWithUser(userId: number) {
    console.log("🔄 reconnectWithUser called with:", userId);
    this.setUserId(userId);
    const socket = this.getSocket();

    console.log("🔌 Socket state:", {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id,
    });

    if (!socket.connected) {
      console.log("🔌 Calling socket.connect()...");
      socket.connect();
    } else {
      console.log("✅ Socket already connected");
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }
}

export const socketManager = SocketManager.getInstance();
export let socket: Socket | null = null;

export const setupSocket = async () => {
  const userId = await socketManager.getUserId();

  if (!userId) {
    console.error("❌ Cannot setup socket: userId not found");
    return null;
  }

  socketManager.setUserId(userId);
  socketManager.reconnectWithUser(userId);
  socket = socketManager.getSocket();

  return socket;
};
(async () => {
  const token = getToken();
  if (token) {
    console.log("🌐 Reinitializing socket after reload...");
    await setupSocket();
  } else {
    console.log("⚠️ No token found, skipping socket setup");
  }
})();
