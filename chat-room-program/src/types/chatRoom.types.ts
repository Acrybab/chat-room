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
}

export interface ChatRoomListResponse {
  data: {
    message: string;
    chatRooms: ChatRoom[];
  };
}

export interface Me {
  id: number;
  email: string;
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
