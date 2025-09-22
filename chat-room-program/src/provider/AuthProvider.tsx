import { AuthContext } from "@/auth/AuthContext";
import { getToken } from "@/lib/cookies";
import type { MeResponse } from "@/types/chatRoom.types";
import type { User } from "@/types/user.types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loggedInUser, setLoggedInUser] = useState<User | undefined>(() => {
    // ✅ Load user từ localStorage khi app khởi động
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : undefined;
  });
  const handleLogOut = () => {
    setLoggedInUser(undefined);
  };

  const getMeFunction = async () => {
    const response = await axios.get(
      "https://chat-room-be-production.up.railway.app/auth/profile",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    return response.data;
  };

  const { data, refetch, isLoading } = useQuery<MeResponse>({
    queryKey: ["getMe"],
    queryFn: getMeFunction,
  });

  useEffect(() => {
    if (data) {
      setLoggedInUser(data.data.user);
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }
  }, [data]);

  if (isLoading) {
    return <></>;
  }

  return (
    <AuthContext.Provider
      value={{
        loggedInUser,
        isLoggedIn: !!loggedInUser,
        handleLogIn: setLoggedInUser,
        handleLogOut,
        updateLoggedInUser: setLoggedInUser,
        accountInfoIsComplete: () => !!(loggedInUser && loggedInUser.email),
        refetchGetMe: refetch,
        isLoadingAuth: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
