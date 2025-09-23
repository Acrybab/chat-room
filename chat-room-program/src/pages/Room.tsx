import { Navigate, useParams } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/cookies";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export const Room = () => {
  const { roomId } = useParams();
  const [isMemberSlideOpen, setIsMemberSlideOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const { message, setMessage, onlineUsers, setOnlineUsers } = useRoomStore();

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
    messages,
    handleTyping,
    isTyping,
  } = useChatRoom({
    message,
    setMessage,
    roomId,
  });

  const { isLoggedIn } = useAuth();

  const getOnlineUsers = async () => {
    const response = await axios.get(
      `https://chat-room-be-production.up.railway.app/users/members/${roomId}`
    );
    return response.data;
  };

  const { data } = useQuery({
    queryKey: ["onlineUsers"],
    queryFn: getOnlineUsers,
  });

  useEffect(() => {
    if (data) {
      setOnlineUsers(data.data.users);
    }
  }, [data, setOnlineUsers]);
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());

  if (!getToken()) {
    return <Navigate to="/sign-in" replace />;
  }
  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  const navigateBack = () => {
    window.history.back();
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="rounded-none border-l-0 border-r-0 border-t-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={navigateBack}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                >
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
                      {onlineUsers?.filter((u) => u.isOnline).length} members
                      online
                    </CardDescription>
                  </div>
                </div>
              </div>
              <HeaderActions
                setStream={setStream}
                stream={stream}
                remoteStreams={remoteStreams}
                setRemoteStreams={setRemoteStreams}
                peerConnections={peerConnections}
                userId={userData?.data.user.id}
                roomId={roomId}
                setIsMemberSlideOpen={setIsMemberSlideOpen}
                isMemberSlideOpen={isMemberSlideOpen}
              />
            </div>
          </CardHeader>
        </Card>
        <MessageArea
          userId={userData?.data.user.id}
          formatTimestamp={formatTimestamp}
          getInitials={getInitials}
          messagesEndRef={messagesEndRef}
          isTyping={isTyping}
          messages={messages}
          currentUserEmail={userData?.data.user.email}
        />

        <MessageInput
          onlineUsers={onlineUsers}
          handleTyping={handleTyping}
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

      {isMemberSlideOpen && (
        <MemberSlide
          onlineUsers={onlineUsers}
          getInitials={getInitials}
          getStatusColor={getStatusColor}
          isOpen={isMemberSlideOpen}
          onClose={() => setIsMemberSlideOpen(false)}
        />
      )}
    </div>
  );
};
