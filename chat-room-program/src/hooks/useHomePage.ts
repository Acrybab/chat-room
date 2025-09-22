import { socket } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import useHomeStore from "@/store/home.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export type CreateRoomType = {
  data: { roomName: string; description: string; roomCategory: string };
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
  const handleJoinRoom = (roomId: number) => {
    // Join room
    socket.emit("joinRoom", { roomId: roomId });

    socket.on("userJoined", (data) => {
      console.log("User joined room:", data);
    });
    navigate(`/room/${roomId}`);
  };

  const createChatRoomFunction = async ({ data }: CreateRoomType) => {
    const response = await axios.post(
      "https://chat-room-be-production.up.railway.app/chat-rooms",
      {
        name: data.roomName,
        description: data.description,
        category: data.roomCategory,
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
    onSuccess: (data) => {
      setIsOpenDialog(false);
      setRoomName("");
      setRoomDescription("");
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      console.log("Chat room created successfully:", data);
    },
    onError: (error) => {
      console.error("Error creating chat room:", error);
    },
  });

  const handleCreateRoom = (
    roomName: string,
    description: string,
    roomCategory: string
  ) => {
    createChatRoom({ data: { roomName, description, roomCategory } });
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
  };
};
