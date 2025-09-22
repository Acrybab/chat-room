// socket.ts - Singleton pattern
import { io, Socket } from "socket.io-client";

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  getSocket(): Socket {
    if (!this.socket || !this.socket.connected) {
      console.log("🔌 Creating new socket connection");

      this.socket = io("https://chat-room-be-production.up.railway.app", {
        transports: ["websocket"],
        forceNew: false,
        reconnection: true,
        autoConnect: false,
        timeout: 5000,
      });

      // Debug events
      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("🚫 Socket connection error:", error);
      });

      // Override emit để debug
      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = (event: string, ...args: unknown[]) => {
        console.log(`📤 Socket emit:`, {
          event,
          args,
          socketId: this.socket?.id,
          timestamp: Date.now(),
        });
        return originalEmit(event, ...args);
      };
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
}

// Export singleton instance
export const socket = SocketManager.getInstance().getSocket();

// Cleanup khi page unload
window.addEventListener("beforeunload", () => {
  SocketManager.getInstance().disconnect();
});
