import { socket } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import useHomeStore from "@/store/home.store";
import type { User, UserResponse } from "@/types/user.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
export type CreateRoomType = {
  data: { roomName: string; memberIds: number[] };
};
export const useHomePage = () => {
  const navigate = useNavigate();
  const {
    roomName,
    roomDescription,
    setRoomName,
    setRoomDescription,
    isOpenDialog,
    setIsOpenDialog,
    roomCategory,
    setRoomCategory,
  } = useHomeStore();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { loggedInUser } = useAuth();

  const handleJoinRoom = (roomId: number) => {
    // Join room
    socket.emit("joinRoom", { roomId: roomId });

    socket.on("userJoined", (data) => {
      console.log("User joined room:", data);
    });
    navigate(`/room/${roomId}`);
  };
  const getAllUsersFunction = async () => {
    const respone = await axios.get(
      "https://chat-room-be-production.up.railway.app/users"
    );
    return respone.data;
  };

  const { data, isLoading, error } = useQuery<UserResponse>({
    queryKey: ["users"],
    queryFn: getAllUsersFunction,
  });
  const isOwner = data?.data.users.map((user) =>
    user.chatRoomMembers?.find((member) => member.isAdmin === true)
  );
  const users = data?.data.users || [];

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      user.id !== loggedInUser?.id
  );
  const createChatRoomFunction = async ({ data }: CreateRoomType) => {
    const response = await axios.post(
      "https://chat-room-be-production.up.railway.app/chat-rooms",
      {
        name: data.roomName,
        memberIds: selectedUsers.map((user) => user.id),
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  };
  const queryClient = useQueryClient();
  const { mutate: createChatRoom } = useMutation({
    mutationFn: createChatRoomFunction,
    onSuccess: () => {
      setIsOpenDialog(false);
      setRoomName("");
      setRoomDescription("");
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      toast.success("Chat room created successfully!", {
        position: "top-right",
        duration: 4000,
        className: "bg-green-500 text-white font-semibold shadow-lg",
      });
    },
    onError: (error) => {
      console.error("Error creating chat room:", error);
      toast.error("Failed to create chat room. Please try again.", {
        position: "top-right",
        duration: 4000,
        className: "bg-red-500 text-white font-semibold shadow-lg",
      });
    },
  });
  console.log(isOwner, "isOwner");
  const handleCreateRoom = (roomName: string) => {
    if (!roomName.trim()) {
      toast.error("Room name cannot be empty.", {
        position: "top-right",
        duration: 4000,
        className: "bg-red-500 text-white font-semibold shadow-lg",
      });
      return;
    }

    createChatRoom({
      data: { roomName, memberIds: selectedUsers.map((user) => user.id) },
    });
  };

  const variants = {
    Public: "default",
    Technology: "secondary",
    Entertainment: "outline",
  } as const;

  type Category = keyof typeof variants;

  const getCategoryVariant = (category: string) => {
    return variants[category as Category] || "default";
  };

  return {
    handleJoinRoom,
    handleCreateRoom,
    getCategoryVariant,
    roomDescription,
    roomName,
    setRoomName,
    setRoomDescription,
    isOpenDialog,
    setIsOpenDialog,
    setRoomCategory,
    roomCategory,
    setSelectedUsers,
    selectedUsers,
    setSearchQuery,
    isLoading,
    error,
    searchQuery,
    filteredUsers,
    isOwner,
  };
};
