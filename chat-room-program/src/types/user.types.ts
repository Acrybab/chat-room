export interface ChatRoomMembers {
  id: number;
  isAdmin: boolean;
}

export interface User {
  id: number;
  isOnline: boolean;
  email: string;
  chatRoomMembers?: ChatRoomMembers[];
}

export type UserResponse = {
  data: {
    message: string;
    users: User[];
  };
};
