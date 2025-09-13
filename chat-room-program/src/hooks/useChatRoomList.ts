import { getToken } from "@/lib/cookies";
import type { ChatRoomListResponse, MeResponse } from "@/types/chatRoom.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useChatRoomList = () => {
  const getAllChatRoomFunction = async () => {
    const response = await axios.get("http://localhost:3000/chat-rooms");
    return response.data;
  };

  const { data, isLoading, error } = useQuery<ChatRoomListResponse>({
    queryKey: ["chatRooms"],
    queryFn: getAllChatRoomFunction,
  });

  const getMeFunction = async () => {
    const response = await axios.get("http://localhost:3000/auth/profile", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
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

  return { data, isLoading, error, meData, isMeLoading, meError };
};
