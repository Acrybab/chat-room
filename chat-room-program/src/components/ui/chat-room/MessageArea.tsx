import React, { type JSX } from "react";
import { ScrollArea } from "../scroll-area";
import { Avatar, AvatarFallback } from "../avatar";
import { Label } from "../label";
import { CheckCheck, Download, FileText } from "lucide-react";

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
  const shouldShowHeader = (
    current: MessageRealTime,
    prev?: MessageRealTime
  ) => {
    if (!prev) return true;
    const sameUser = prev.user.id === current.user.id;
    const timeDiff =
      new Date(current.createdAt).getTime() -
      new Date(prev.createdAt).getTime();

    return !sameUser || timeDiff > 5 * 60 * 1000;
  };

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

      parts.push(
        <span
          key={match.index}
          className={
            isOwn
              ? "font-bold text-white"
              : isMe
              ? "bg-blue-100 dark:bg-blue-900 px-1 rounded text-blue-600 font-bold"
              : "text-blue-600 font-bold"
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
  console.log(currentUserEmail);
  // Render file message content
  const renderFileContent = (msg: MessageRealTime, isOwn: boolean) => {
    if (!msg.fileUrl) return null;

    const fileType = msg.fileType || "";
    const fileName = msg.fileName || msg.fileUrl.split("/").pop() || "file";
    // const getClient: SupabaseClient;
    // IMAGE - Hiển thị như Zalo
    console.log("Rendering file message:", {
      fileType,
      fileName,
      fileUrl: msg.fileUrl,
    });

    if (fileType.startsWith("image/")) {
      return (
        <div className="mt-1">
          <img
            src={msg.fileUrl}
            alt={fileName}
            className="max-w-[300px] max-h-[400px] rounded-lg cursor-pointer hover:opacity-95 transition-opacity object-cover"
            onClick={() => window.open(msg.fileUrl, "_blank")}
          />
        </div>
      );
    }

    // VIDEO
    if (fileType.startsWith("video/")) {
      return (
        <div className="mt-1">
          <video
            src={msg.fileUrl}
            controls
            className="max-w-[300px] max-h-[400px] rounded-lg"
          >
            Your browser does not support video.
          </video>
        </div>
      );
    }

    // OTHER FILES - Card giống Zalo
    return (
      <div className="mt-1">
        <a
          href={msg.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-3 rounded-lg min-w-[200px] max-w-[300px] transition-colors ${
            isOwn
              ? "bg-white/10 hover:bg-white/20"
              : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
          }`}
        >
          <div
            className={`p-2 rounded ${
              isOwn ? "bg-white/20" : "bg-gray-100 dark:bg-gray-600"
            }`}
          >
            <FileText
              className={`h-5 w-5 ${
                isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isOwn ? "text-white" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {fileName}
            </p>
            <p
              className={`text-xs ${
                isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {fileType.split("/")[1]?.toUpperCase() || "FILE"}
            </p>
          </div>
          <Download
            className={`h-4 w-4 flex-shrink-0 ${
              isOwn ? "text-white/70" : "text-gray-400"
            }`}
          />
        </a>
      </div>
    );
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
                    <AvatarFallback className="text-xs font-semibold bg-black text-white">
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
                  className={`relative rounded-2xl max-w-full break-words transition-all duration-200 group-hover:shadow-sm ${
                    msg.type === "file" && msg.fileType?.startsWith("image/")
                      ? "" // Không có padding cho ảnh
                      : "px-4 py-2" // Có padding cho text và file khác
                  } ${
                    isOwn
                      ? "bg-black text-white rounded-br-md shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                  }`}
                >
                  {/* TEXT MESSAGE */}
                  {msg.type === "text" && msg.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                      {highlightMentions(
                        msg.content,
                        isOwn,
                        userId
                          ? messages.find((m) => m.user.id === userId)?.user
                              .email
                          : undefined
                      )}
                    </p>
                  )}

                  {/* FILE MESSAGE */}
                  {msg.type === "file" && renderFileContent(msg, isOwn)}
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
