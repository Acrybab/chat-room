import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button } from "../button";
import {
  MoreVertical,
  Search,
  Settings,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
// import { VideoCall } from "./VideoCall";
import { SelectUserDialog } from "./SelectUserDialog";
import { useState } from "react";
import { VideoCall } from "./VideoCall";

interface HeaderActionsProps {
  userId: number | undefined;
  roomId: string | undefined;
  setIsMemberSlideOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMemberSlideOpen: boolean;
}

export const HeaderActions = ({
  userId,
  roomId,
  setIsMemberSlideOpen,
  isMemberSlideOpen,
}: HeaderActionsProps) => {
  console.log(userId, roomId, "header actions props");
  const [openDialog, setOpenDialog] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const peerId = 27; // ID của người bạn muốn gọi, tạm thời để cố định
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Search messages
          </TooltipContent>
        </Tooltip>

        {/* Voice Call Button - Commented out but keeping structure */}
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Start voice call
          </TooltipContent>
        </Tooltip> */}

        {/* Video Call Button - Commented out but keeping structure */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsCalling(true)}
            >
              {/* <VideoCall /> */}
              <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Start video call
          </TooltipContent>
        </Tooltip>
        {isCalling && userId && (
          <VideoCall
            userId={userId}
            peerId={peerId}
            active={isCalling}
            onClose={() => setIsCalling(false)}
          />
        )}
        <Button onClick={() => setIsMemberSlideOpen(!isMemberSlideOpen)}>
          <Users className="h-4 w-4" />
        </Button>
      </TooltipProvider>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl"
        >
          <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg mx-1 my-1">
            <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Room Settings
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenDialog(true)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg mx-1 my-1"
          >
            <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Invite Members
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 border-gray-200 dark:border-gray-700" />

          <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg mx-1 my-1 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 font-medium">
            <span>Leave Room</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Select User Dialog */}
      <SelectUserDialog
        roomId={roomId}
        ownerId={userId}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />
    </div>
  );
};
