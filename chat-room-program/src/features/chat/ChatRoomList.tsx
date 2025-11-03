import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { socket } from "@/components/ui/chat-room/socket";
import { useChatRoomList } from "@/hooks/useChatRoomList";
import type { Room } from "@/types/chatRoom.types";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  Hash,
  Users,
  MessageCircle,
  Crown,
  Shield,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface ChatRoomListProps {
  getCategoryVariant: (category: string) => "default" | "secondary" | "outline";
  handleJoinRoom: (roomId: number, userId: number) => void;
}

export const ChatRoomList = ({
  getCategoryVariant,
  handleJoinRoom,
}: ChatRoomListProps) => {
  const { meData, rooms, setRooms, isLoading } = useChatRoomList();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("🔧 Setting up socket listener, current socket state:", {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id,
    });

    if (!socket || !socket.connected) {
      console.warn("⚠️ Socket not connected");
      return;
    }

    const handleAddedToRoom = (payload: { room: Room }) => {
      console.log("day ne");
      console.log("🎉 RECEIVED addedToRoom event:", {
        payload,
        currentRoomsCount: rooms.length,
        timestamp: new Date().toISOString(),
      });

      // Use array update directly since setRooms does not accept an updater function
      const isDuplicate = rooms.some((r) => r.id === payload.room.id);

      if (isDuplicate) {
        console.warn("⚠️ Room already exists, skipping");
        return;
      }

      toast.success(`You were added to ${payload.room.name}`, {
        description: payload.room.description,
        duration: 5000,
      });

      const newRooms = [...rooms, payload.room];
      console.log("✅ Updated rooms array:", {
        oldCount: rooms.length,
        newCount: newRooms.length,
      });
      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });

      setRooms(newRooms);
    };

    console.log("📡 Registering addedToRoom listener");
    socket.on("addedToRoom", handleAddedToRoom);

    return () => {
      console.log("🧹 Cleaning up addedToRoom listener");
      socket.off("addedToRoom", handleAddedToRoom);
    };
  }, [setRooms]);
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {[...Array(6)].map((_, index) => (
          <Card
            key={index}
            className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 border-2 backdrop-blur-sm animate-pulse"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                {/* Skeleton Avatar */}
                <div className="w-14 h-14 bg-muted rounded-full" />

                <div className="flex-1 space-y-2">
                  {/* Skeleton Title */}
                  <div className="h-6 bg-muted rounded w-3/4" />
                  {/* Skeleton Badges */}
                  <div className="flex gap-2">
                    <div className="h-4 bg-muted rounded-full w-16" />
                    <div className="h-4 bg-muted rounded-full w-12" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Skeleton Description */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </div>
              </div>

              {/* Skeleton Stats */}
              <div className="flex justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-8" />
                    <div className="h-3 bg-muted rounded w-12" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-12" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>

              {/* Skeleton Message */}
              <div className="bg-muted/30 rounded-xl p-4 border-l-4 border-muted">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-muted rounded-md mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>

              {/* Skeleton Button */}
              <div className="h-14 bg-muted rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {rooms.map((room) => (
        <Card
          onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
          key={room.id}
          className="group relative overflow-hidden bg-gradient-to-br from-background to-muted/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/20 backdrop-blur-sm"
        >
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Status indicator */}
          {room.isActive && (
            <div className="absolute top-4 right-4 z-10">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
            </div>
          )}

          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Enhanced Avatar with gradient */}
                <div className="relative">
                  <Avatar
                    className={`w-14 h-14 border-3 shadow-lg ${
                      room.isActive
                        ? "border-green-500 bg-gradient-to-br from-green-400 to-green-600"
                        : "border-slate-400 bg-gradient-to-br from-slate-400 to-slate-600"
                    } transition-all duration-300 group-hover:scale-110`}
                  >
                    <AvatarFallback className="text-white font-bold text-lg bg-transparent">
                      <Hash className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Premium room indicator */}
                  {room.isPrivate && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors duration-300 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {room.name}
                  </CardTitle>

                  {/* Enhanced badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                      variant={getCategoryVariant(room.category)}
                      className="text-xs font-semibold px-3 py-1 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {room.category}
                    </Badge>

                    {room.isActive && (
                      <Badge className="text-xs bg-green-500/20 text-green-700 border-green-500/30 px-2 py-1 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                        Live
                      </Badge>
                    )}

                    {room.isPrivate && (
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-500/30 text-yellow-700 bg-yellow-500/10 px-2 py-1"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 relative z-10">
            {/* Enhanced description */}
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4 border border-muted/50 backdrop-blur-sm">
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                {room.description || "No description available"}
              </CardDescription>
            </div>

            {/* Enhanced Stats with icons */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl border border-accent/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-foreground">{room.memberCount}</div>
                  <div className="text-xs text-muted-foreground">members</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div className="text-right">
                  <div className="text-foreground text-xs">
                    {new Date(room.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">updated</div>
                </div>
              </div>
            </div>

            {/* Enhanced Last Message */}
            <div className="bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl p-4 border-l-4 border-primary/30 backdrop-blur-sm hover:bg-muted/40 transition-colors duration-300">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-primary/10 rounded-md mt-0.5">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {room.messages?.length > 0
                      ? room.messages[room.messages?.length - 1]?.content
                      : "No messages yet - be the first to start the conversation! 🚀"}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Join Button */}
            {room.owner.id && (
              <Button
                onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
                className={`w-full gap-3 group/btn relative overflow-hidden text-base font-semibold py-6 rounded-xl transition-all duration-300 ${
                  room.isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25"
                    : "bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary border-2 border-border hover:border-primary/50"
                }`}
                variant={room.isActive ? "default" : "outline"}
              >
                {/* Button background animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />

                <div className="relative flex items-center gap-3">
                  {room.isActive ? (
                    <>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Join Live Room
                    </>
                  ) : (
                    "Join Room"
                  )}
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </div>
              </Button>
            )}
          </CardContent>

          {/* Corner decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
      ))}
    </div>
  );
};
