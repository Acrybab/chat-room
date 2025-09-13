import { useParams } from "react-router-dom";
import { ArrowLeft, Hash } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useRoomStore } from "@/store/room.store";
import { useChatRoom } from "@/hooks/useChatRoom";
import { HeaderActions } from "@/components/ui/chat-room/HeaderActions";
import { MessageArea } from "@/components/ui/chat-room/MessageArea";
import { MessageInput } from "@/components/ui/chat-room/MessageInput";
import { MemberSlide } from "@/components/ui/chat-room/MemberSlide";

export const Room = () => {
  const { roomId } = useParams();

  const { message, setMessage, onlineUsers, isTyping } = useRoomStore();

  const {
    messagesEndRef,
    inputRef,
    handleSendMessage,
    handleKeyPress,
    getRoomName,
    getStatusColor,
    formatTimestamp,
    getInitials,
    userData,
    allMessages,
  } = useChatRoom({
    message,
    setMessage,
    roomId,
  });
  console.log(allMessages, "messages in room");
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="rounded-none border-l-0 border-r-0 border-t-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Hash className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{getRoomName()}</CardTitle>
                    <CardDescription className="text-sm">
                      {onlineUsers?.filter((u) => u.status === "online").length}{" "}
                      members online
                    </CardDescription>
                  </div>
                </div>
              </div>
              <HeaderActions userId={userData?.data.user.id} roomId={roomId} />
            </div>
          </CardHeader>
        </Card>
        <MessageArea
          userId={userData?.data.user.id}
          // messagesData={messagesData}
          formatTimestamp={formatTimestamp}
          getInitials={getInitials}
          messagesEndRef={messagesEndRef}
          isTyping={isTyping}
          // messages={messages}
          allMessages={allMessages}
        />

        <MessageInput
          userData={userData}
          roomId={roomId}
          message={message}
          setMessage={setMessage}
          inputRef={inputRef}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          getRoomName={getRoomName}
        />
      </div>

      <MemberSlide
        onlineUsers={onlineUsers}
        getInitials={getInitials}
        getStatusColor={getStatusColor}
      />
    </div>
  );
};
