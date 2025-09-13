import { getToken } from "@/lib/cookies";
import type { MeResponse, MessageResponse } from "@/types/chatRoom.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface UseChatRoomProps {
  roomId: string | undefined;
  message: string;
  setMessage: (message: string) => void;
}
export interface MessageRealTime {
  // id: number;
  isOwn: boolean;
  content: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
  fileUrl?: string;
  chatRoom: {
    id: number;
  };
}
export const useChatRoom = ({
  roomId,
  message,
  setMessage,
}: UseChatRoomProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<MessageRealTime[]>([]);

  const getMeFunction = async () => {
    const respone = await axios.get("http://localhost:3000/auth/profile", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return respone.data;
  };
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const { data: userData } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: getMeFunction,
  });

  const getMessagesFunction = async () => {
    const response = await axios.get(
      `http://localhost:3000/messages/${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response.data;
  };

  const { data: messagesData } = useQuery<MessageResponse>({
    queryKey: ["messages", roomId],
    queryFn: getMessagesFunction,
    enabled: !!roomId,
  });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!userData?.data.user.id || !roomId) return;

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:3000", {
        query: { userId: userData.data.user.id },
      });
    }

    const socket = socketRef.current;

    // Sau khi connect -> join vào room
    socket.emit("joinRoom", {
      userId: userData.data.user.id,
      roomId: Number(roomId),
    });

    // Lắng nghe newMessage
    const handleNewMessage = (msg: MessageRealTime) => {
      console.log("Received newMessage:", msg);
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("newMessage", handleNewMessage);

    // cleanup
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userData?.data.user.id, roomId]);
  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim() || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      roomId: Number(roomId),
      userId: userData?.data.user.id as number,
      content: message.trim(),
    });

    setMessage("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  // Handle key press
  const handleKeyPress = (e: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const allMessages = [...(messagesData?.data.messages || []), ...messages];
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);
  // Get room name based on ID
  const getRoomName = () => {
    const roomNames = {
      "1": "General Discussion",
      "2": "Tech Talk",
      "3": "Random Chat",
    };
    return (
      roomNames[roomId as keyof typeof roomNames] || `Room ${roomId ?? ""}`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "away":
        return "text-yellow-500";
      case "offline":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return {
    messagesEndRef,
    inputRef,
    handleSendMessage,
    handleKeyPress,
    getRoomName,
    getStatusColor,
    formatTimestamp,
    getInitials,
    messagesData,
    userData,
    messages,
    allMessages,
  };
};
