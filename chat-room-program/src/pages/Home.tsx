import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HeaderSection } from "@/components/ui/home-page/HeaderSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatRoomList } from "@/features/chat/ChatRoomList";
import { useAuth } from "@/hooks/useAuth";
import { useHomePage } from "@/hooks/useHomePage";
import { getToken } from "@/lib/cookies";
import type { User } from "@/types/user.types";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";

export const Home = () => {
  const {
    handleJoinRoom,
    handleCreateRoom,
    getCategoryVariant,
    isOpenDialog,
    roomName,
    setIsOpenDialog,
    setRoomName,
    selectedUsers,
    setSelectedUsers,
    setSearchQuery,
    isLoading,
    error,
    searchQuery,
    filteredUsers,
  } = useHomePage();
  const { isLoadingAuth, isLoggedIn } = useAuth();

  const removeSelectedUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (!getToken()) {
    return <Navigate to="/sign-in" replace />;
  }
  if (isLoadingAuth) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  const isUserSelected = (userId: number) => {
    return selectedUsers.some((u) => u.id === userId);
  };
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <HeaderSection />
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Available Rooms</h2>
            <p className="text-muted-foreground">
              Choose a room to start chatting
            </p>
          </div>
          <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsOpenDialog(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r">
                  Create a New Chat Room
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Set up your chat room with a name, description, and category
                  to help others find and join your community.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="roomName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Chat Room Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="roomName"
                    placeholder="Enter room name"
                    onChange={(e) => setRoomName(e.target.value)}
                    value={roomName}
                    className="transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <div>Select User to createe</div>
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
                  {selectedUsers.length > 0 && (
                    <div className="px-6 py-3 border-b border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => {
                          return (
                            <div
                              key={user.id}
                              className="flex items-center bg-gray-100 text-black px-3 py-1 rounded-full text-sm font-medium"
                            >
                              <div>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* User List */}
                  <div className="max-h-80 overflow-y-auto">
                    {isLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                          <span className="text-gray-600">
                            Loading people...
                          </span>
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
                        <p className="text-gray-600 font-medium">
                          Couldn't load people
                        </p>
                        <p className="text-gray-500 text-sm">
                          Please try again
                        </p>
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
                        <p className="text-gray-600 font-medium">
                          No people found
                        </p>
                        <p className="text-gray-500 text-sm">
                          Try a different search
                        </p>
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
                                  user.isOnline
                                    ? "text-green-600"
                                    : "text-gray-500"
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
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpenDialog(false)}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleCreateRoom(roomName);
                    setRoomName("");
                  }}
                  disabled={!roomName.trim()}
                  className=" text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ChatRoomList
          getCategoryVariant={getCategoryVariant}
          handleJoinRoom={handleJoinRoom}
        />
      </div>
    </div>
  );
};
