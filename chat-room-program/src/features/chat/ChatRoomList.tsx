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
import { useChatRoomList } from "@/hooks/useChatRoomList";
import { ArrowRight, Clock, Hash, Users } from "lucide-react";

interface ChatRoomListProps {
  getCategoryVariant: (category: string) => "default" | "secondary" | "outline";
  handleJoinRoom: (roomId: number, userId: number) => void;
}

export const ChatRoomList = ({
  getCategoryVariant,
  handleJoinRoom,
}: ChatRoomListProps) => {
  const { data, meData } = useChatRoomList();
  console.log(meData);
  console.log(data?.data.chatRooms, "sss");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {data?.data.chatRooms.map((room) => (
        <Card
          key={room.id}
          className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  className={`${
                    room.isActive ? "bg-green-500" : "bg-gray-500"
                  } border-2 border-background`}
                >
                  <AvatarFallback className="text-white font-bold">
                    <Hash className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl truncate group-hover:text-primary transition-colors">
                    {room.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={getCategoryVariant(room.category)}
                      className="text-xs"
                    >
                      {room.category}
                    </Badge>
                    {room.isActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600">Live</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              {room.description}
            </CardDescription>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{room.members.length} users</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(room.updatedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Last Message */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {/* 💬{" "}
                {room.messages.length > 0
                  ? room.messages[room.messages.length - 1].content
                  : "No messages yet"} */}
              </p>
            </div>

            {/* Join Button */}
            <Button
              onClick={() => handleJoinRoom(room.id, meData!.data.user.id)}
              className="w-full gap-2 group/btn"
              variant={room.isActive ? "default" : "outline"}
            >
              {room.isActive ? "Join Room" : "Join Room"}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
