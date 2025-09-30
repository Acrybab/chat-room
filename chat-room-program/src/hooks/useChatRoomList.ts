import { socket } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import { useRoomStore } from "@/store/room.store";
import type { ChatRoomListResponse, MeResponse } from "@/types/chatRoom.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

export const useChatRoomList = () => {
  const [isUserOnline, setIsUserOnline] = useState<boolean>(false);
  // const [rooms, setRooms] = useState<any[]>([]);
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
    // console.log(response.data.data.chatRooms, "chat rooms from api");
    // setRooms(response.data.data.chatRooms);
    return response.data;
  };

  const { data, isLoading, error } = useQuery<ChatRoomListResponse>({
    queryKey: ["chatRooms"],
    queryFn: getAllChatRoomFunction,
  });

  useEffect(() => {
    setRooms(data?.data.chatRooms || []);
  }, [data]);

  useEffect(() => {
    socket?.on("userStatusChanged", (data) => {
      setIsUserOnline(data.isOnline);
      console.log("User status changed:", data);
    });

    return () => {
      socket?.off("userStatusChanged");
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
