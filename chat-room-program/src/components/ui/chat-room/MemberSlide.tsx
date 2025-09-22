import { Users } from "lucide-react";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import { Avatar, AvatarFallback } from "../avatar";
import type { OnlineUser } from "@/store/room.store";

interface MemberSlideProps {
  onlineUsers: OnlineUser[];
  getInitials: (name: string) => string;
  getStatusColor: (status: string) => string;
  isOpen: boolean;
  onClose: () => void;
}

const statusOrder: Record<string, number> = {
  true: 0, // online
  false: 1, // offline/away
};

export const MemberSlide = ({
  onlineUsers,
  getInitials,
  isOpen,
  onClose,
}: MemberSlideProps) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Member slide */}
      <div
        className={`
        fixed lg:relative top-0 right-0 lg:right-auto
        w-80 h-full lg:h-auto
        border-l border-gray-200 dark:border-gray-800 
        bg-white dark:bg-gray-900 lg:bg-white/80 lg:dark:bg-gray-900/80 
        lg:backdrop-blur-sm
        z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        ${isOpen ? "lg:flex" : "hidden lg:flex"} 
        lg:flex-col
      `}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Members
              </h3>
            </div>
            <Badge
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {onlineUsers?.length}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {onlineUsers?.filter((u) => u.isOnline).length} online,{" "}
            {onlineUsers?.filter((u) => !u.isOnline).length} away
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {onlineUsers
              ?.sort((a, b) => {
                return (
                  statusOrder[String(a.isOnline)] -
                  statusOrder[String(b.isOnline)]
                );
              })
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9 ring-2 ring-gray-100 dark:ring-gray-800">
                      <AvatarFallback className="text-xs font-semibold bg-black text-white">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        user.isOnline
                          ? "bg-green-500"
                          : "bg-gray-400 dark:bg-gray-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.email}
                        {user.id === "current_user" && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            {" "}
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-xs font-medium ${
                          user.isOnline
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};
