import type { User } from "@/types/user.types";
import { createContext } from "react";

type AuthContextType = {
  loggedInUser?: User;
  isLoggedIn: boolean;
  handleLogIn: (user: User) => void;
  handleLogOut: () => void;
  updateLoggedInUser: (user: User) => void;
  accountInfoIsComplete: () => boolean;
  refetchGetMe: () => void;
  isLoadingAuth?: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
