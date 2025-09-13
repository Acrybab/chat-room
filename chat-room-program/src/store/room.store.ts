import { create } from "zustand";

export type Message = {
  userId: number;
  content: string;
  roomId: number;
  isOwn: boolean;
};

export type OnlineUser = {
  id: string;
  name: string;
  status: string;
  avatar: string;
  role: string;
};

type RoomState = {
  message: string;
  setMessage: (message: string) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
};

export const useRoomStore = create<RoomState>((set) => ({
  message: "",
  setMessage: (message: string) => set({ message }),
  messages: [],
  setMessages: (messages: Message[]) => set({ messages }),
  onlineUsers: [],
  setOnlineUsers: (users: OnlineUser[]) => set({ onlineUsers: users }),
  isTyping: false,
  setIsTyping: (isTyping: boolean) => set({ isTyping }),
}));
