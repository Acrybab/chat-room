import { AuthContext } from "@/auth/AuthContext";
import { socketManager } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import type { MeResponse } from "@/types/chatRoom.types";
import type { User } from "@/types/user.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo/Icon with chat bubble animation */}
        <div className="relative">
          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.29-3.86-.81l-.28-.13-2.76.47.47-2.76-.13-.28C4.29 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>

          {/* Orbital spinner */}
          <div className="absolute -inset-4">
            <div className="w-full h-full border-4 border-transparent border-t-black rounded-full animate-spin"></div>
          </div>

          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-2xl bg-black opacity-20 animate-ping"></div>
        </div>

        {/* Text with typing animation */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Chat<span className="text-black">Room</span>
          </h3>
          <div className="flex items-center justify-center gap-1">
            <p className="text-sm text-gray-600 font-medium">Loading</p>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></span>
              <span
                className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loggedInUser, setLoggedInUser] = useState<User | undefined>(() => {
    // ✅ Load user từ localStorage khi app khởi động
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : undefined;
  });

  const handleLogOut = () => {
    setLoggedInUser(undefined);
  };

  const getMeFunction = async () => {
    const token = getToken(); // ✅ Lấy từ localStorage
    const response = await axios.get(
      "https://chat-room-be-production.up.railway.app/auth/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Dùng lại header
        },
      }
    );
    return response.data;
  };

  const { data, refetch, isLoading } = useQuery<MeResponse>({
    queryKey: ["getMe"],
    queryFn: getMeFunction,
  });

  useEffect(() => {
    console.log("🔍 Checking URL for OAuth token...");
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("🎫 Token found in URL:", token.substring(0, 20) + "...");

      try {
        // Decode token để lấy userId
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("📦 Decoded token payload:", payload);

        const userId = payload.sub || payload.userId || payload.id;
        console.log("👤 Extracted userId:", userId);

        if (userId) {
          // Lưu token và userId
          localStorage.setItem("chat_room_token", token);
          localStorage.setItem("userId", userId.toString());

          console.log("💾 Saved to localStorage:", {
            userId,
            hasToken: !!token,
          });

          // ✅ Reconnect socket với userId ngay lập tức
          console.log("🔌 Reconnecting socket with userId:", userId);
          socketManager.reconnectWithUser(userId);
        } else {
          console.error("❌ No userId found in token payload!");
        }
      } catch (error) {
        console.error("❌ Error decoding token:", error);
      }

      // Xóa token khỏi URL
      window.history.replaceState({}, "", window.location.pathname);

      // Refetch user info
      refetch();
    } else {
      console.log("ℹ️ No token in URL");

      // ✅ Nếu đã có user trong localStorage, reconnect socket
      const storedUserId = localStorage.getItem("userId");
      const storedUser = localStorage.getItem("user");

      if (storedUserId && storedUser) {
        console.log(
          "💾 Found stored user, reconnecting socket with userId:",
          storedUserId
        );
        socketManager.reconnectWithUser(Number(storedUserId));
      }
    }
  }, [refetch]);

  // ✅ Effect khi user data được load
  useEffect(() => {
    if (data?.data?.user) {
      console.log("✅ User data loaded:", data.data.user);

      setLoggedInUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      const userId = data.data.user.id;
      localStorage.setItem("userId", userId.toString());

      // ✅ Đảm bảo socket connected với userId
      console.log("🔌 Ensuring socket connection with userId:", userId);
      socketManager.reconnectWithUser(userId);
    }
  }, [data]);

  // ✅ Effect kiểm tra socket state khi component mount
  useEffect(() => {
    if (loggedInUser?.id) {
      console.log("👤 LoggedInUser exists, checking socket connection");
      const socket = socketManager.getSocket();

      if (!socket.connected) {
        console.log(
          "🔌 Socket not connected, connecting with userId:",
          loggedInUser.id
        );
        socketManager.reconnectWithUser(loggedInUser.id);
      } else {
        console.log("✅ Socket already connected");
      }
    }
  }, [loggedInUser]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider
      value={{
        loggedInUser,
        isLoggedIn: !!loggedInUser,
        handleLogIn: setLoggedInUser,
        handleLogOut,
        updateLoggedInUser: setLoggedInUser,
        accountInfoIsComplete: () => !!(loggedInUser && loggedInUser.email),
        refetchGetMe: refetch,
        isLoadingAuth: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
