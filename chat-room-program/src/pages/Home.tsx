/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { StatsCards } from "@/components/ui/home-page/StatsCards";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatRoomList } from "@/features/chat/ChatRoomList";
import { useAuth } from "@/hooks/useAuth";
import { useHomePage } from "@/hooks/useHomePage";
import { getToken } from "@/lib/cookies";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";

export const Home = () => {
  const {
    handleJoinRoom,
    handleCreateRoom,
    getCategoryVariant,
    isOpenDialog,
    roomDescription,
    roomName,
    setIsOpenDialog,
    setRoomDescription,
    setRoomName,
    roomCategory,
    setRoomCategory,
    data,
  } = useHomePage();
  const { isLoadingAuth, isLoggedIn } = useAuth();

  const onlineUsers = data.data.users.map(
    (i: { isOnline: any }) => i.isOnline
  ).lenght;

  if (!getToken()) {
    return <Navigate to="/sign-in" replace />;
  }
  if (isLoadingAuth) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }
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

                <div className="space-y-2">
                  <Label
                    htmlFor="roomDescription"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description
                  </Label>
                  <Input
                    id="roomDescription"
                    placeholder="Enter room description"
                    onChange={(e) => setRoomDescription(e.target.value)}
                    value={roomDescription}
                    className="transition-all duration-200 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="roomCategory"
                    className="text-sm font-medium text-gray-700"
                  >
                    Category
                  </Label>
                  <Input
                    id="roomCategory"
                    placeholder="Enter room category"
                    onChange={(e) => setRoomCategory(e.target.value)}
                    value={roomCategory}
                    className="transition-all duration-200 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
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
                    handleCreateRoom(roomName, roomDescription, roomCategory);
                    setRoomName("");
                    setRoomDescription("");
                    setRoomCategory("");
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
        <StatsCards onlineUsers={onlineUsers} />
      </div>
    </div>
  );
};
