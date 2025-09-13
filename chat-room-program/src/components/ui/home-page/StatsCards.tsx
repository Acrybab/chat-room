import { Hash, MessageCircle, Users, Zap } from "lucide-react";
import { chatRooms } from "@/data/dummyChatRooms";
import { Card, CardContent } from "../card";

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-blue-500">
              {chatRooms.reduce((total, room) => total + room.numberOfUser, 0)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Active Users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Hash className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-purple-500">
              {chatRooms.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Chat Rooms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-green-500">1.2K</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Messages Today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-orange-500">24/7</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">Online</p>
        </CardContent>
      </Card>
    </div>
  );
};
