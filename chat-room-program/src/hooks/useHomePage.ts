import useHomeStore from "@/store/home.store";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
export type CreateRoomType = {
  data: { roomName: string; description: string };
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
  } = useHomeStore();
  const socket = io("http://localhost:3000");

  const handleJoinRoom = (roomId: number, userId: number) => {
    // Join room
    socket.emit("joinRoom", { userId: userId, roomId: roomId });

    socket.on("userJoined", (data) => {
      console.log("User joined room:", data);
    });
    navigate(`/room/${roomId}`);
  };

  const createChatRoomFunction = async ({ data }: CreateRoomType) => {
    const response = await axios.post("http://localhost:3000/chat-rooms", {
      name: data.roomName,
      description: data.description,
    });
    return response.data;
  };

  const { mutate: createChatRoom } = useMutation({
    mutationFn: createChatRoomFunction,
    onSuccess: (data) => {
      setIsOpenDialog(false);
      setRoomName("");
      setRoomDescription("");
      console.log("Chat room created successfully:", data);
    },
    onError: (error) => {
      console.error("Error creating chat room:", error);
    },
  });

  const handleCreateRoom = (roomName: string, description: string) => {
    createChatRoom({ data: { roomName, description } });
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
  };
};
