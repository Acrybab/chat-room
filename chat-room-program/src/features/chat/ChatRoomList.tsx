import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { socket } from "@/components/ui/chat-room/socket";
import { useChatRoomList } from "@/hooks/useChatRoomList";
import type { Room } from "@/types/chatRoom.types";
import { useQueryClient } from "@tanstack/react-query";
import { Hash, Users, Crown, Shield } from "lucide-react";
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
      <div className="space-y-0">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-3 animate-pulse"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-muted rounded-full" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted/70 rounded w-48" />
            </div>
            <div className="h-3 bg-muted/50 rounded w-12 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {rooms.map((room) => (
        <div
          key={room.id}
          onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
          className="group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-primary hover:rounded-2xl"
        >
          {/* Avatar with status */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12">
              <AvatarFallback
                className={`text-white font-semibold text-base ${
                  room.isActive
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-slate-500 to-slate-600"
                }`}
              >
                <Hash className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>

            {/* Status dot - simple and clean */}
            {room.isActive && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}

            {/* Private indicator */}
            {room.isPrivate && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground group-hover:text-white truncate">
                {room.name}
              </h3>

              {room.isPrivate && (
                <Shield className="w-3 h-3 text-muted-foreground group-hover:text-white/70 flex-shrink-0" />
              )}
            </div>

            {/* Message preview */}
            <p className="text-xs text-muted-foreground group-hover:text-white/80 truncate">
              {room.messages?.length > 0
                ? room.messages[room.messages?.length - 1]?.content
                : "No messages yet"}
            </p>
          </div>

          {/* Time and member count */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs text-muted-foreground group-hover:text-white/70">
              {new Date(room.updatedAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>

            {/* Member count badge */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 group-hover:bg-white/20 rounded-full">
              <Users className="w-2.5 h-2.5 text-muted-foreground group-hover:text-white/70" />
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-white/70">
                {room.memberCount}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
