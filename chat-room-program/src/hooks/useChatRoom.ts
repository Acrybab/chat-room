import { socket } from "@/components/ui/chat-room/socket";
import { getToken } from "@/lib/cookies";
import type { MeResponse, MessageResponse } from "@/types/chatRoom.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatRoomProps {
  roomId: string | undefined;
  message: string;
  setMessage: (message: string) => void;
}

export interface MessageRealTime {
  id: number;
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
  readBy?: number[]; // 🆕 thêm read receipt
}
export interface ChatRoomDetail {
  id: number;
  name: string;
  isPrivate: boolean;
  category: string;
  description: string;
}
export interface ChatRoomDetailResponse {
  data: {
    message: string;
    chatRoom: ChatRoomDetail;
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
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  let typingTimeout: NodeJS.Timeout;

  const getRoomById = async (roomId: string) => {
    const response = await axios.get(
      `https://chat-room-be-production.up.railway.app/chat-rooms/${roomId}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
    return response.data;
  };

  const { data: roomDetail } = useQuery<ChatRoomDetailResponse>({
    queryKey: ["room", roomId],
    queryFn: () => getRoomById(roomId as string),
    enabled: !!roomId,
  });

  // Get current user
  const getMeFunction = async () => {
    const response = await axios.get(
      "https://chat-room-be-production.up.railway.app/auth/profile",
      {
        headers: { Authorization: `Bearer ${getToken()}` },
        withCredentials: true,
      }
    );
    return response.data;
  };

  const { data: userData } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: getMeFunction,
  });

  // Get messages in room
  const getMessagesFunction = async () => {
    const response = await axios.get(
      `https://chat-room-be-production.up.railway.app/messages/${roomId}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
    return response.data;
  };

  const { data: messagesData } = useQuery<MessageResponse>({
    queryKey: ["messages", roomId],
    queryFn: getMessagesFunction,
    enabled: !!roomId,
  });

  // Set messages
  useEffect(() => {
    if (messagesData?.data.messages && userData?.data.user.id) {
      const messagesWithOwnership = messagesData.data.messages.map((msg) => ({
        ...msg,
        isOwn: msg.user.id === userData.data.user.id,
      }));
      setMessages(messagesWithOwnership);
    }
  }, [messagesData, userData?.data.user.id]);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Socket connection
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // New message
  const handleNewMessage = useCallback(
    (msg: MessageRealTime) => {
      if (!userData?.data.user.id) return;

      setMessages((prev) => {
        const exists = prev.some((existingMsg) => existingMsg.id === msg.id);
        if (exists) return prev;

        const messageWithOwnership = {
          ...msg,
          isOwn: msg.user.id === userData.data.user.id,
        };

        return [...prev, messageWithOwnership];
      });
    },
    [userData?.data.user.id]
  );

  useEffect(() => {
    if (!userData?.data.user.id || !isConnected) return;

    socket.off("newMessage", handleNewMessage);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [userData?.data.user.id, isConnected, handleNewMessage]);

  // Join room
  useEffect(() => {
    if (roomId && userData?.data.user.id && isConnected) {
      socket.emit("joinRoom", {
        userId: userData.data.user.id,
        roomId: Number(roomId),
      });
    }
  }, [roomId, userData?.data.user.id, isConnected]);

  // Send message
  const handleSendMessage = () => {
    if (!message.trim() || !isConnected || !userData?.data.user.id) return;

    const messageData = {
      roomId: Number(roomId),
      userId: userData.data.user.id,
      content: message.trim(),
    };

    socket.emit("sendMessage", messageData);
    setMessage("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Key press
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

  // Scroll when new message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicator
  const handleTyping = () => {
    if (!roomId || !userData?.data.user.id) return;

    socket.emit("typing", {
      roomId: Number(roomId),
      userId: Number(userData.data.user.id),
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        roomId: Number(roomId),
        userId: Number(userData.data.user.id),
      });
    }, 2000);
  };

  useEffect(() => {
    if (!isConnected) return;

    socket.on("typing", ({ userId }) => {
      if (userId !== userData?.data.user.id) {
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
      }
    });

    socket.on("stopTyping", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on("messageRead", ({ userId, messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, readBy: [...(m.readBy || []), userId] }
            : m
        )
      );
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageRead");
    };
  }, [isConnected, userData?.data.user.id]);

  // 🆕 Mark as read (khi load tin nhắn cuối)
  useEffect(() => {
    if (!messages.length || !userData?.data.user.id) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.user.id !== userData.data.user.id) {
      socket.emit("markAsRead", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        messageId: lastMsg.id,
      });
    }
  }, [messages, roomId, userData?.data.user.id]);

  // Helpers
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      ?.map((n) => n[0])
      ?.join("")
      ?.toUpperCase();

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
      default:
        return "text-gray-400";
    }
  };

  return {
    messagesEndRef,
    inputRef,
    handleSendMessage,
    handleKeyPress,
    handleTyping, // 🆕 dùng trong onChange input
    getRoomName,
    getStatusColor,
    formatTimestamp,
    getInitials,
    userData,
    messages,
    isConnected,
    roomDetail,
    typingUsers, // 🆕 để hiển thị "typing..."
    isTyping: typingUsers.length > 0, // 🆕 có ai đang gõ không
  };
};
