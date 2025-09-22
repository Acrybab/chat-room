import React, { type JSX } from "react";
import { ScrollArea } from "../scroll-area";
import { Avatar, AvatarFallback } from "../avatar";
import { Label } from "../label";
import { CheckCheck } from "lucide-react";

import type { MessageRealTime } from "@/hooks/useChatRoom";

interface MessageAreaProps {
  formatTimestamp: (timestamp: string) => string;
  getInitials: (name: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isTyping: boolean;
  userId: number | undefined;
  messages: MessageRealTime[];
  currentUserEmail: string | undefined;
}

export const MessageArea = ({
  currentUserEmail,
  userId,
  formatTimestamp,
  messagesEndRef,
  isTyping,
  messages,
  getInitials,
}: MessageAreaProps) => {
  console.log(currentUserEmail, "current user email");

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
  // helper: highlight @mention
  const highlightMentions = (
    text: string,
    isOwn: boolean,
    currentUserEmail?: string
  ) => {
    const regex = /@([\w.-]+@[\w.-]+\.\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const mentionedEmail = match[1];
      const isMe = currentUserEmail && mentionedEmail === currentUserEmail;
      console.log(isMe, "is me");
      parts.push(
        <span
          key={match.index}
          className={
            isOwn
              ? "font-bold text-white" // khi mình là người gửi -> highlight trắng đậm
              : "text-blue-600 font-bold" // khi người khác gửi -> xanh đậm
          }
        >
          @{mentionedEmail}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="space-y-4 pb-6 max-w-4xl mx-auto">
        {messages.map((msg, index) => {
          const isOwn = msg.user.id === userId;
          const prevMsg = index > 0 ? messages[index - 1] : undefined;
          const showHeader = shouldShowHeader(msg, prevMsg);

          return (
            <div
              key={index}
              className={`group flex gap-3 ${
                isOwn ? "justify-end" : "justify-start"
              } transition-all duration-200`}
            >
              {/* Avatar cho người khác */}
              {!isOwn && showHeader && (
                <div className="flex-shrink-0 mt-1">
                  <Avatar className="h-8 w-8 ring-2 ring-gray-100 dark:ring-gray-800">
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                      {getInitials(msg.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Spacer khi không có avatar */}
              {!isOwn && !showHeader && <div className="w-8 flex-shrink-0" />}

              {/* Container cho message */}
              <div
                className={`flex flex-col max-w-[70%] ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {/* Header (tên + timestamp) */}
                {!isOwn && showHeader && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {msg.user.email}
                    </Label>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Bong bóng tin nhắn */}
                <div
                  className={`relative px-4 py-2 rounded-2xl max-w-full break-words transition-all duration-200 group-hover:shadow-sm ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-md shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {highlightMentions(
                      msg.content,
                      isOwn,
                      userId
                        ? messages.find((m) => m.user.id === userId)?.user.email
                        : undefined
                    )}
                  </p>

                  {msg.fileUrl && (
                    <div className="mt-2">
                      {msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
                        <img
                          src={`http://localhost:3000/messages/photo/${msg.fileUrl}`}
                          alt="img"
                          className="max-w-sm rounded-lg shadow-sm"
                        />
                      )}

                      {msg.fileUrl.match(/\.(mp4|webm|ogg)$/i) && (
                        <video
                          src={msg.fileUrl}
                          controls
                          className="max-w-sm rounded-lg shadow-sm"
                        />
                      )}

                      {msg.fileUrl.match(/\.(pdf|docx?|xlsx?|zip|mp3)$/i) && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        >
                          <span className="text-base">📎</span>
                          <span className="truncate max-w-[200px]">
                            {msg.fileUrl.split("/").pop()}
                          </span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp và status cho tin nhắn của mình */}
                {isOwn && showHeader && (
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                    {msg.readBy && msg.readBy.length > 0 && (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 animate-fadeIn">
            <div className="flex-shrink-0 mt-1">
              <Avatar className="h-8 w-8 ring-2 ring-gray-100 dark:ring-gray-800">
                <AvatarFallback className="bg-gray-300 dark:bg-gray-600">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex justify-center items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
