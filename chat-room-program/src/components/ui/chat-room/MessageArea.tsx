import React from "react";
import { ScrollArea } from "../scroll-area";
import { Avatar, AvatarFallback } from "../avatar";
import { Label } from "../label";
import { Card, CardContent } from "../card";
import { Clock, CheckCheck } from "lucide-react";

import type { MessageRealTime } from "@/hooks/useChatRoom";

interface MessageAreaProps {
  formatTimestamp: (timestamp: string) => string;
  getInitials: (name: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isTyping: boolean;
  userId: number | undefined;
  allMessages: MessageRealTime[];
}

export const MessageArea = ({
  userId,
  formatTimestamp,
  messagesEndRef,
  isTyping,
  allMessages,
  getInitials,
}: MessageAreaProps) => {
  const shouldShowHeader = (
    current: MessageRealTime,
    prev?: MessageRealTime
  ) => {
    if (!prev) return true;
    const sameUser = prev.user.id === current.user.id;
    const timeDiff =
      new Date(current.createdAt).getTime() -
      new Date(prev.createdAt).getTime();

    // Nếu khác user hoặc cách nhau > 5 phút thì hiện header
    return !sameUser || timeDiff > 5 * 60 * 1000;
  };
  console.log(allMessages, "allMessages in message area");
  return (
    <ScrollArea className="flex-1 px-6 py-4">
      <div className="space-y-6 pb-6">
        {allMessages.map((msg, index) => {
          const isOwn = msg.user.id === userId;
          const prevMsg = index > 0 ? allMessages[index - 1] : undefined;
          const showHeader = shouldShowHeader(msg, prevMsg);
          // const fileUrl = msg.fileUrl;

          return (
            <div
              key={index}
              className={`group flex gap-3 ${
                isOwn ? "justify-end" : "justify-start"
              } transition-all duration-200 hover:translate-y-[-1px]`}
            >
              {/* Avatar cho người khác, chỉ hiện khi cần */}
              {!isOwn && showHeader && (
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-white/20 shadow-lg ring-2 ring-blue-500/10">
                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(msg.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Spacer khi không có avatar */}
              {!isOwn && !showHeader && <div className="w-10 flex-shrink-0" />}

              {/* Container cho message */}
              <div
                className={`flex flex-col max-w-[75%] ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {/* Header (tên + timestamp), chỉ hiện nếu cần */}
                {!isOwn && showHeader && (
                  <div className="flex items-center gap-3 mb-2">
                    <Label className="text-sm font-semibold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                      {msg.user.email}
                    </Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(msg.createdAt)}</span>
                    </div>
                  </div>
                )}

                {/* Bong bóng tin nhắn với hiệu ứng modern */}
                <div className={`relative ${isOwn ? "ml-auto" : "mr-auto"}`}>
                  {/* Glow effect for own messages */}
                  {isOwn && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-lg scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}

                  <Card
                    className={`relative shadow-lg backdrop-blur-sm border-0 transition-all duration-300 group-hover:shadow-xl ${
                      isOwn
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl rounded-br-lg shadow-blue-500/25"
                        : "bg-white/80 dark:bg-slate-800/80 text-foreground rounded-3xl rounded-bl-lg border border-white/20 dark:border-slate-700/50"
                    }`}
                  >
                    <CardContent className="px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                        {msg.content}
                      </p>
                      {msg.fileUrl && (
                        <>
                          {msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                            <img
                              src={`http://localhost:3000/messages/photo/${msg.fileUrl}`}
                              alt="img"
                              className="max-w-xs rounded-lg"
                            />
                          )}

                          {msg.fileUrl.match(/\.(mp4|webm|ogg)$/i) && (
                            <video
                              src={msg.fileUrl}
                              controls
                              className="max-w-xs rounded-lg"
                            />
                          )}

                          {msg.fileUrl.match(
                            /\.(pdf|docx?|xlsx?|zip|mp3)$/i
                          ) && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-2 border rounded-lg bg-gray-100"
                            >
                              📎 {msg.fileUrl.split("/").pop()}
                            </a>
                          )}
                        </>
                      )}
                    </CardContent>

                    {/* Message tail */}
                    <div
                      className={`absolute bottom-0 w-4 h-4 ${
                        isOwn
                          ? "right-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-bl-full"
                          : "left-0 bg-white/80 dark:bg-slate-800/80 border-l border-b border-white/20 dark:border-slate-700/50 rounded-br-full"
                      }`}
                      style={{
                        clipPath: isOwn
                          ? "polygon(0 0, 100% 0, 100% 100%)"
                          : "polygon(0 0, 0 100%, 100% 100%)",
                      }}
                    />
                  </Card>
                </div>

                {/* Nếu là tin nhắn của mình + header thì show timestamp với status */}
                {isOwn && showHeader && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(msg.createdAt)}</span>
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Enhanced Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 animate-fadeIn">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10 border-2 border-white/20 shadow-lg">
                <AvatarFallback className="text-sm bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </AvatarFallback>
              </Avatar>
            </div>

            <Card className="bg-white/80 dark:bg-slate-800/80 max-w-[120px] rounded-3xl rounded-bl-lg shadow-lg border border-white/20 dark:border-slate-700/50 backdrop-blur-sm">
              <CardContent className="px-4 py-3">
                <div className="flex justify-center items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </CardContent>

              {/* Typing indicator tail */}
              <div
                className="absolute bottom-0 left-0 w-4 h-4 bg-white/80 dark:bg-slate-800/80 border-l border-b border-white/20 dark:border-slate-700/50 rounded-br-full"
                style={{
                  clipPath: "polygon(0 0, 0 100%, 100% 100%)",
                }}
              />
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
