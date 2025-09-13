import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../card";
import { Circle, Users } from "lucide-react";
import { Badge } from "../badge";
import { Separator } from "../separator";
import { ScrollArea } from "../scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import type { OnlineUser } from "@/store/room.store";

interface MemberSlideProps {
  onlineUsers: OnlineUser[];

  getInitials: (name: string) => string;
  getStatusColor: (status: string) => string;
}

export const MemberSlide = ({
  onlineUsers,
  getInitials,
  getStatusColor,
}: MemberSlideProps) => {
  return (
    <Card className="hidden lg:block w-80 rounded-none border-t-0 border-r-0 border-b-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
          <Badge variant="secondary">{onlineUsers?.length}</Badge>
        </div>
        <CardDescription>
          {onlineUsers?.filter((u) => u.status === "online").length} online,{" "}
          {onlineUsers?.filter((u) => u.status === "away").length} away
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-3">
            {onlineUsers
              ?.sort((a, b) => {
                // Sort by status: online first, then away, then offline
                type Status = "online" | "away" | "offline";
                const statusOrder: Record<Status, number> = {
                  online: 0,
                  away: 1,
                  offline: 2,
                };
                return (
                  statusOrder[a.status as Status] -
                  statusOrder[b.status as Status]
                );
              })
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background fill-current ${getStatusColor(
                        user.status
                      )}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name}
                      {user.id === "current_user" && " (You)"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {user.status}
                      </Badge>
                      {user.role === "moderator" && (
                        <Badge variant="secondary" className="text-xs">
                          Mod
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
