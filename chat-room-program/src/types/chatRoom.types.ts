import type { Owner } from "@/store/room.store";

export interface ChatRoom {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  category: string;
  isActive: boolean;
  messages: [];
  members: [];
  updatedAt: string;
  isPrivate: boolean;
  memberCount: number;
  owner: Owner;
  userRole: string;
}

export interface ChatRoomListResponse {
  data: {
    message: string;
    chatRooms: ChatRoom[];
  };
}
export type Room = {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  memberCount: number;
  messages: Message[];
  userRole: string;
};

export interface Me {
  id: number;
  email: string;
  isOnline: boolean;
}

export interface MeResponse {
  data: {
    message: string;
    user: Me;
  };
}

export interface Message {
  id: number;
  isOwn: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  roomId: number;
  user: {
    id: number;
    email: string;
  };
  chatRoom: {
    id: number;
    name: string;
    isPrivate: boolean;
    category: string;
    decscription: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

export interface MessageResponse {
  data: {
    message: string;
    messages: Message[];
  };
}
