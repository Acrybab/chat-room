import React, { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button } from "../button";
import { Paperclip, Send, Smile } from "lucide-react";
import { Textarea } from "../textarea";
import type { MeResponse } from "@/types/chatRoom.types";
import { socket } from "./socket";
import type { OnlineUser } from "@/store/room.store";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSendMessage: () => void;
  handleKeyPress: (e: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }) => void;
  getRoomName: () => string;
  roomId: string | undefined;
  userData: MeResponse | undefined;
  handleTyping: () => void;
  onlineUsers: OnlineUser[];
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  inputRef,
  handleSendMessage,
  handleKeyPress,
  getRoomName,
  roomId,
  userData,
  handleTyping,
  onlineUsers,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // mention states
  const [query, setQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // demo participants, sau này bạn truyền từ props hoặc context

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && socket && userData) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
        e.target.value = "";
        return;
      }

      try {
        const base64Data = await fileToBase64(file);
        socket.emit("uploadFile", {
          roomId: parseInt(roomId!),
          userId: userData.data.user.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: base64Data,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Có lỗi xảy ra khi xử lý file!");
      }
    }
    e.target.value = "";
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-end gap-3">
          {/* File attachment button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleFileButtonClick}
                  type="button"
                >
                  <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Attach file
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            multiple={false}
          />

          {/* Message input container */}
          <div className="flex-1 relative">
            <div className="flex items-end bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative">
              <Textarea
                ref={inputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();

                  const value = e.target.value;
                  const match = value
                    .slice(0, e.target.selectionStart)
                    .match(/@(\w*)$/);
                  if (match) {
                    setQuery(match[1]);
                    setCursorPos(e.target.selectionStart);
                    setShowMentionList(true);
                  } else {
                    setShowMentionList(false);
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${getRoomName()}...`}
                className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 px-4 py-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={1}
              />

              {/* Emoji button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
                    >
                      <Smile className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Add emoji
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mention dropdown */}
            {showMentionList && (
              <div className="absolute bottom-14 left-3 w-fit bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                {onlineUsers
                  .filter((u) =>
                    u.email.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (cursorPos !== null) {
                          const before = message.slice(
                            0,
                            cursorPos - query.length - 1 // trừ đi cả dấu @ gốc
                          );
                          const after = message.slice(cursorPos);

                          // chỉ thêm email, KHÔNG thêm @ nữa
                          const newMsg = `${before}@${u.email} ${after}`;

                          setMessage(newMsg);
                          setShowMentionList(false);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {u.email}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="icon"
            className={`h-9 w-9 shrink-0 rounded-full transition-all ${
              message.trim()
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
