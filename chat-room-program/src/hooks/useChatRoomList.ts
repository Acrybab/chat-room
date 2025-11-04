/* eslint-disable @typescript-eslint/no-explicit-any */
// useChatRoomList.ts
import { setupSocket, socket } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import { useRoomStore } from "@/store/room.store";
import type { ChatRoomListResponse, MeResponse } from "@/types/chatRoom.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

export const useChatRoomList = () => {
  const [isUserOnline, setIsUserOnline] = useState<boolean>(false);
  const { rooms, setRooms } = useRoomStore();

  const getMeFunction = async () => {
    const response = await axios.get(
      "https://chat-room-be-production.up.railway.app/auth/profile",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  };

  const {
    data: meData,
    isLoading: isMeLoading,
    error: meError,
  } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: getMeFunction,
  });

  const getAllChatRoomFunction = async () => {
    const response = await axios.get(
      "https://chat-room-be-production.up.railway.app/chat-rooms",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  };

  const { data, isLoading, error } = useQuery<ChatRoomListResponse>({
    queryKey: ["chatRooms"],
    queryFn: getAllChatRoomFunction,
  });
  useEffect(() => {
    const initSocket = async () => {
      // Khởi tạo socket nếu chưa có
      if (!socket || !socket.connected) {
        await setupSocket();
      }
    };

    initSocket();
  }, []);

  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ Socket not available in useChatRoomList");
      return;
    }

    const handleUserStatusChanged = (data: any) => {
      setIsUserOnline(data.isOnline);
      console.log("👥 User status changed:", data);
    };

    socket.on("userStatusChanged", handleUserStatusChanged);

    return () => {
      socket?.off("userStatusChanged", handleUserStatusChanged);
    };
  }, []);

  useEffect(() => {
    setRooms(data?.data.chatRooms || []);
  }, [data, setRooms]);

  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ Socket not available in useChatRoomList");
      return;
    }

    console.log("🎧 [useChatRoomList] Setting up userStatusChanged listener");

    const handleUserStatusChanged = (data: any) => {
      setIsUserOnline(data.isOnline);
      console.log("👥 [useChatRoomList] User status changed:", data);
    };

    socket.on("userStatusChanged", handleUserStatusChanged);

    return () => {
      socket?.off("userStatusChanged", handleUserStatusChanged);
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    meData,
    isMeLoading,
    meError,
    isUserOnline,
    setRooms,
    rooms,
  };
};
