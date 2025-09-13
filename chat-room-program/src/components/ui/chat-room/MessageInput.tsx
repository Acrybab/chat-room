import React, { useRef } from "react";
import { Card, CardContent } from "../card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button } from "../button";
import { Paperclip, Send, Smile } from "lucide-react";
import { Textarea } from "../textarea";
import axios from "axios";
import { getToken } from "@/lib/cookies";
// Removed incorrect import of File type
import { useMutation } from "@tanstack/react-query";
import { socket } from "./socket";
import type { MeResponse } from "@/types/chatRoom.types";

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(
      `http://localhost:3000/messages/${roomId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    socket.emit("sendFile", {
      fileUrl: response.data.fileUrl,
      userId: userData?.data.user.id,
      roomId,
    });
    return response.data; // Assuming the server responds with the file URL or relevant data
  };

  const { mutate: onFileSelect } = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      console.log(data, "data from upload file");

      // You can handle success actions here, like updating the UI or notifying the user
      // For example, you might want to append the new file message to the chat
    },
    onError: (error) => {
      console.error("File upload failed:", error);
      // Handle error scenarios, like showing an error message to the user
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log(file, "selected file");
    if (file) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  return (
    <Card className="rounded-none border-l-0 border-r-0 border-b-0">
      <CardContent className="p-4">
        <div className="flex items-end space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleFileButtonClick}
                  type="button"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" // Adjust accepted file types as needed
            multiple={false} // Set to true if you want to allow multiple file selection
          />

          <div className="flex-1 min-w-0">
            <Textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${getRoomName()}...`}
              className="min-h-[40px] max-h-32 resize-none"
              rows={1}
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add emoji</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
