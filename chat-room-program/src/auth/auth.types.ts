import type { User } from "@/types/user.types";
import type { Dispatch } from "react";
export type AuthActionType = "INITIALIZE" | "SIGN_IN" | "SIGN_OUT";

export const AUTH_ACTION_TYPE = {
  INITIALIZE: "INITIALIZE" as AuthActionType,
  SIGN_IN: "SIGN_IN" as AuthActionType,
  SIGN_OUT: "SIGN_OUT" as AuthActionType,
};
export interface AuthState {
  isAuthenticated?: boolean;
  isInitialized?: boolean;
  user: User | null;
}

export interface PayloadAction<T> {
  type: AuthActionType;
  payload: T;
}
export interface AuthContextType extends AuthState {
  dispatch: Dispatch<PayloadAction<AuthState>>;
}
