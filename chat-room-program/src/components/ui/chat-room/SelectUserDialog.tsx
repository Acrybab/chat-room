/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { Dialog, DialogContent, DialogHeader } from "../dialog";
import { useQuery } from "@tanstack/react-query";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useState } from "react";
import type { User, UserResponse } from "@/types/user.types";
import { socket } from "./socket";
import { Button } from "../button";

interface SelectUserDialogProps {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  ownerId: number | undefined;
  roomId: string | undefined;
}

export const SelectUserDialog = ({
  openDialog,
  setOpenDialog,
  ownerId,
  roomId,
}: SelectUserDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const getAllUsersFunction = async () => {
    const respone = await axios.get(
      "https://chat-room-be-production.up.railway.app/users"
    );
    return respone.data;
  };

  const { data, isLoading, error } = useQuery<UserResponse>({
    queryKey: ["users"],
    queryFn: getAllUsersFunction,
  });

  const users = data?.data.users || [];

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const isUserSelected = (userId: number) => {
    return selectedUsers.some((u) => u.id === userId);
  };

  const handleAddUserToGroup = () => {
    if (!roomId || !ownerId) {
      console.error("❌ Missing roomId or ownerId", { roomId, ownerId });
      return;
    }

    const userIds = selectedUsers.map((user) => user.id);

    console.log("🚀 Emitting addUserToRoom:", {
      roomId: parseInt(roomId),
      ownerId: ownerId,
      newUserIds: userIds,
      socketConnected: socket.connected,
      socketId: socket.id,
    });

    socket.emit(
      "addUserToRoom",
      {
        roomId: parseInt(roomId),
        ownerId: ownerId,
        newUserIds: userIds,
      },
      (response: any) => {
        console.log("📥 Server response:", response);
      }
    );

    setSelectedUsers([]);
    setOpenDialog(false);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="max-w-lg mx-auto p-0 bg-white rounded-xl shadow-2xl border-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center">
            Add people to group
          </DialogTitle>
        </DialogHeader>

        {/* Recently Added Rooms */}

        {/* Debug info */}

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Selected Users Pills */}
        {selectedUsers.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center bg-gray-100 text-black px-3 py-1 rounded-full text-sm font-medium"
                >
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-24 truncate">
                    {user.email.split("@")[0]}
                  </span>
                  <button
                    onClick={() => removeSelectedUser(user.id)}
                    className="ml-2 hover:bg-gray-200 rounded-full p-0.5 transition-colors duration-150"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-gray-600">Loading people...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-3">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Couldn't load people</p>
              <p className="text-gray-500 text-sm">Please try again</p>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-3">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No people found</p>
              <p className="text-gray-500 text-sm">Try a different search</p>
            </div>
          )}

          {filteredUsers.map((user, index) => {
            const isSelected = isUserSelected(user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                className={`flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                  index !== filteredUsers.length - 1
                    ? "border-b border-gray-50"
                    : ""
                } ${isSelected ? "bg-gray-100" : ""}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  {/* Online indicator */}
                  {user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isSelected ? "text-black" : "text-gray-900"
                    }`}
                  >
                    {user.email}
                  </p>
                  <div className="flex items-center mt-0.5">
                    <span
                      className={`text-sm ${
                        user.isOnline ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {user.isOnline ? "Active now" : "Offline"}
                    </span>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-gray-500 border-gray-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        {selectedUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} people selected
              </span>
              <div className="flex space-x-3">
                <Button
                  variant={"outline"}
                  onClick={() => setSelectedUsers([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-150"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleAddUserToGroup}
                  className="px-6 py-2 text-white font-medium rounded-full transition-all duration-150 shadow-sm hover:shadow-md"
                >
                  Add to Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
