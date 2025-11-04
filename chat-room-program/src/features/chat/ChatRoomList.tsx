import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { socket } from "@/components/ui/chat-room/socket";
import { useChatRoomList } from "@/hooks/useChatRoomList";
import type { Room } from "@/types/chatRoom.types";
import { useQueryClient } from "@tanstack/react-query";
import { Hash, Users, Crown, Shield, Circle } from "lucide-react";
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
      <div className="space-y-2">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors animate-pulse"
          >
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-muted rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
              <div className="h-3 bg-muted rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rooms.map((room) => (
        <div
          key={room.id}
          onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
          className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          {/* Avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <Avatar
              className={`w-14 h-14 border-2 transition-all duration-200 ${
                room.isActive ? "border-green-500" : "border-transparent"
              }`}
            >
              <AvatarFallback
                className={`text-white font-semibold text-lg ${
                  room.isActive
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-gray-500 to-gray-600"
                }`}
              >
                <Hash className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>

            {/* Status dot */}
            {room.isActive && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
            )}

            {/* Private badge */}
            {room.isPrivate && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate text-foreground">
                  {room.name}
                </h3>

                {/* Badges inline */}
                {room.isPrivate && (
                  <Shield className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                )}
                {room.isActive && (
                  <Circle className="w-2 h-2 text-green-500 fill-green-500 flex-shrink-0" />
                )}
              </div>

              {/* Time */}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(room.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Last message preview */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {room.messages?.length > 0
                  ? room.messages[room.messages?.length - 1]?.content
                  : "Start a conversation..."}
              </p>

              {/* Member count badge */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Users className="w-3.5 h-3.5" />
                <span>{room.memberCount}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
