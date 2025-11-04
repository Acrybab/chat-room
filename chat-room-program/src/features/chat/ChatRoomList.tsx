import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { socket } from "@/components/ui/chat-room/socket";
import { useChatRoomList } from "@/hooks/useChatRoomList";
import type { Room } from "@/types/chatRoom.types";
import { useQueryClient } from "@tanstack/react-query";
import {
  Hash,
  Users,
  Crown,
  Shield,
  Circle,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface ChatRoomListProps {
  getCategoryVariant: (category: string) => "default" | "secondary" | "outline";
  handleJoinRoom: (roomId: number, userId: number) => void;
}

export const ChatRoomList = ({ handleJoinRoom }: ChatRoomListProps) => {
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

      queryClient.invalidateQueries({ queryKey: ["chatRooms"] });

      setRooms(newRooms);
    };

    socket.on("addedToRoom", handleAddedToRoom);

    return () => {
      socket?.off("addedToRoom", handleAddedToRoom);
    };
  }, [setRooms]);

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="relative flex items-center gap-4 p-4 rounded-2xl transition-all animate-pulse"
          >
            {/* Skeleton glow effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent rounded-2xl animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
            />

            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-full" />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-muted rounded-full border-2 border-background" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gradient-to-r from-muted to-muted/50 rounded-lg w-36" />
                <div className="h-4 bg-muted/70 rounded-full w-16" />
              </div>
              <div className="h-4 bg-gradient-to-r from-muted/70 to-muted/30 rounded-lg w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {rooms.map((room, index) => {
        const isHot = room.memberCount > 10;
        const isNew =
          new Date().getTime() - new Date(room.updatedAt).getTime() < 3600000; // 1 hour

        return (
          <div
            key={room.id}
            onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
            className="group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30 active:scale-[0.98] overflow-hidden"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Animated background gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
            />

            {/* Glowing border effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-xl" />

            {/* Content wrapper */}
            <div className="relative flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar with enhanced effects */}
              <div className="relative flex-shrink-0">
                {/* Glow ring for active rooms */}
                {room.isActive && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-20 blur-md animate-pulse" />
                )}

                <Avatar
                  className={`w-16 h-16 border-[3px] transition-all duration-300 group-hover:scale-110 relative z-10 ${
                    room.isActive
                      ? "border-green-400 shadow-lg shadow-green-500/30"
                      : "border-transparent group-hover:border-primary/30"
                  }`}
                >
                  <AvatarFallback
                    className={`text-white font-bold text-xl transition-all duration-300 ${
                      room.isActive
                        ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
                        : "bg-gradient-to-br from-gray-500 via-gray-600 to-slate-600 group-hover:from-gray-400 group-hover:to-slate-500"
                    }`}
                  >
                    <Hash className="w-7 h-7" />
                  </AvatarFallback>
                </Avatar>

                {/* Animated status dot */}
                {room.isActive && (
                  <div className="absolute bottom-0 right-0 z-20">
                    <div className="relative">
                      <div className="w-5 h-5 bg-green-500 border-[3px] border-background rounded-full" />
                      <div className="absolute inset-0 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                  </div>
                )}

                {/* Private badge with shine effect */}
                {room.isPrivate && (
                  <div className="absolute -top-1 -right-1 z-20">
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40">
                        <Crown className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-yellow-300 rounded-full blur-sm opacity-50 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Hot badge */}
                {isHot && !room.isPrivate && (
                  <div className="absolute -top-1 -right-1 z-20">
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 animate-bounce">
                        <Zap className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="font-bold text-base truncate text-foreground group-hover:text-primary transition-colors duration-300">
                      {room.name}
                    </h3>

                    {/* Inline status badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {room.isPrivate && (
                        <div className="p-0.5 bg-yellow-500/20 rounded-md">
                          <Shield className="w-3 h-3 text-yellow-600" />
                        </div>
                      )}
                      {room.isActive && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                          <Circle className="w-1.5 h-1.5 text-green-500 fill-green-500 animate-pulse" />
                          <span className="text-[10px] font-semibold text-green-600">
                            LIVE
                          </span>
                        </div>
                      )}
                      {isNew && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full">
                          <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                          <span className="text-[10px] font-semibold text-blue-600">
                            NEW
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time with hover effect */}
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                    {new Date(room.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Last message preview with gradient fade */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors truncate">
                      {room.messages?.length > 0
                        ? room.messages[room.messages?.length - 1]?.content
                        : "✨ Start a conversation..."}
                    </p>
                    {/* Gradient fade effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent group-hover:from-accent/50" />
                  </div>

                  {/* Enhanced member count */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 group-hover:bg-primary/10 rounded-full transition-all duration-300 flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      {room.memberCount}
                    </span>
                    {isHot && (
                      <TrendingUp className="w-3 h-3 text-red-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover indicator arrow */}
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 border-t-2 border-r-2 border-primary transform rotate-45" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Add shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
};
