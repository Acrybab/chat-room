export interface User {
  id: number;
  isOnline: boolean;
  email: string;
}

export type UserResponse = {
  data: {
    message: string;
    users: User[];
  };
};
