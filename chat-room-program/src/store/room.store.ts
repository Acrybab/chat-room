import { create } from "zustand";

export type Message = {
  userId: number;
  type: "text" | "file";

  content: string;
  roomId: number;
  isOwn: boolean;
};
export type Owner = {
  id: number;
  email: string;
  isOnline: boolean;
};

export type Room = {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  owner: Owner;
  messages: Message[];
  userRole: string;
};

export type OnlineUser = {
  id: string;
  email: string;
  isOnline: boolean;
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
  setRooms: (rooms: Room[]) => void;
  rooms: Room[];
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
  rooms: [],
  setRooms: (rooms: Room[]) => set({ rooms }),
}));
