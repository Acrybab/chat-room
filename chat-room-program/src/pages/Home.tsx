import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HeaderSection } from "@/components/ui/home-page/HeaderSection";
import { StatsCards } from "@/components/ui/home-page/StatsCards";
import { Input } from "@/components/ui/input";
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
  } = useHomePage();
  const { isLoadingAuth, isLoggedIn } = useAuth();

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Chat Room</DialogTitle>
              </DialogHeader>
              <div>
                <div>
                  <p>Chat Room Name:</p>
                  <Input
                    placeholder="Enter room name"
                    onChange={(e) => setRoomName(e.target.value)}
                    value={roomName}
                  />
                </div>
                <div>
                  <p>Description:</p>
                  <Input
                    placeholder="Enter room description"
                    onChange={(e) => setRoomDescription(e.target.value)}
                    value={roomDescription}
                  />
                </div>
                <div>
                  <p>Category:</p>
                  <Input
                    placeholder="Enter room category"
                    onChange={(e) => setRoomCategory(e.target.value)}
                    value={roomCategory}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    handleCreateRoom(roomName, roomDescription, roomCategory);
                    setRoomName("");
                    setRoomDescription("");
                  }}
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
        <StatsCards />
      </div>
    </div>
  );
};
