// socket.ts
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

  // Thêm method để set userId
  setUserId(userId: number) {
    this.userId = userId;

    // Nếu socket đang connected, disconnect và reconnect với userId mới
    if (this.socket?.connected) {
      console.log("🔄 Reconnecting socket with new userId:", userId);
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket {
    if (!this.socket || !this.socket.connected) {
      console.log(
        "🔌 Creating new socket connection with userId:",
        this.userId
      );

      this.socket = io("https://chat-room-be-production.up.railway.app", {
        transports: ["websocket"],
        forceNew: false,
        reconnection: true,
        autoConnect: false,
        timeout: 5 * 60 * 1000,
        auth: {
          userId: this.userId, // ✅ Gửi userId lên socket
        },
      });

      // Debug events
      this.socket.on("connect", () => {
        console.log(
          "✅ Socket connected:",
          this.socket?.id,
          "userId:",
          this.userId
        );
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("🚫 Socket connection error:", error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Method để reconnect với userId mới
  reconnectWithUser(userId: number) {
    this.setUserId(userId);
    const socket = this.getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }
}

export const socketManager = SocketManager.getInstance();
export const socket = socketManager.getSocket();
