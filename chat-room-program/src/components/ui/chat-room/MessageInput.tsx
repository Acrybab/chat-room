import React, { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button } from "../button";
import { Paperclip, Send, Smile, Loader2, Mic, X, Square } from "lucide-react";
import { Textarea } from "../textarea";
import type { MeResponse } from "@/types/chatRoom.types";
import { socket } from "./socket";
import type { OnlineUser } from "@/store/room.store";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { SkinTones } from "emoji-picker-react";
import { getToken } from "@/lib/cookies";

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
  roomId: string | undefined;
  userData: MeResponse | undefined;
  handleTyping: () => void;
  onlineUsers: OnlineUser[];
  roomName: string | undefined;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  inputRef,
  handleSendMessage,
  handleKeyPress,
  roomId,
  userData,
  handleTyping,
  onlineUsers,
  roomName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // mention states
  const [query, setQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [skinTone, setSkinTone] = useState(SkinTones.NEUTRAL);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const escapeRegExp = (string: string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const handleOpenEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    const emoji = emojiData.emoji;
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const newMessage =
        message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(
          start + emoji.length,
          start + emoji.length
        );
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleChangeSkinTone = (tone: SkinTones) => {
    setSkinTone(tone);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const emojiMap: Record<string, string> = {
    ":))": "😆",
    ":)": "🙂",
    ":(": "🙁",
    "<3": "❤️",
    ":D": "😃",
  };

  // Xử lý khi chọn file - TỰ ĐỘNG UPLOAD LUÔN (giống Zalo)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !userData || !roomId) {
      e.target.value = "";
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
      e.target.value = "";
      return;
    }

    // Set file info và bắt đầu upload
    setUploadingFile(file);
    setIsUploading(true);

    // Tạo preview cho hình ảnh
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    try {
      // 1. Upload file lên server
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `https://chat-room-be-production.up.railway.app/messages/${roomId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      const fileUrl = data.fileUrl;

      // Gửi socket như cũ
      socket.emit("sendFileMessage", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: file.type,
      });
      console.log("📤 Emitted sendFileMessage:", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: file.type,
      });
      console.log("✅ File uploaded and sent successfully");
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      alert("Không thể upload file. Vui lòng thử lại!");
    } finally {
      // Reset tất cả states
      setUploadingFile(null);
      setFilePreview(null);
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Voice recording functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());

        // Tự động gửi voice message ngay khi dừng (giống Messenger)
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      const stream = mediaRecorderRef.current.stream;
      mediaRecorderRef.current.stop();
      stream.getTracks().forEach((track) => track.stop());

      // Clear chunks để không gửi
      audioChunksRef.current = [];
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!audioBlob || !roomId || !userData || !socket) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");

      const response = await fetch(
        `https://chat-room-be-production.up.railway.app/messages/${roomId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      const fileUrl = data.fileUrl;

      // Gửi socket voice message
      socket.emit("sendFileMessage", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        fileUrl: fileUrl,
        fileName: "voice-message.webm",
        fileType: "audio/webm",
      });
      console.log("📤 Emitted voice message:", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        fileUrl: fileUrl,
      });
      console.log("✅ Voice message sent successfully");

      // Reset states
      setRecordingTime(0);
    } catch (error) {
      console.error("❌ Error sending voice message:", error);
      alert("Không thể gửi tin nhắn thoại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        {/* Upload Progress Indicator - Hiện khi đang upload */}
        {isUploading && uploadingFile && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {uploadingFile.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Đang gửi...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  disabled={isUploading || isRecording}
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

          {/* Message input container hoặc Voice Recording UI */}
          {!isRecording ? (
            <>
              <div className="flex-1 relative">
                <div className="flex items-end bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative">
                  <Textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                      let value = e.target.value;

                      Object.entries(emojiMap).forEach(([pattern, emoji]) => {
                        const regex = new RegExp(escapeRegExp(pattern), "g");
                        value = value.replace(regex, emoji);
                      });

                      setMessage(value);
                      handleTyping();

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
                    placeholder={`Message ${roomName}...`}
                    className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 px-4 py-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    disabled={isUploading}
                  />

                  {/* Emoji button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
                          onClick={() => handleOpenEmoji()}
                          disabled={isUploading}
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

                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-50">
                    <EmojiPicker
                      allowExpandReactions
                      onEmojiClick={handleEmojiClick}
                      onSkinToneChange={(skinTone) => {
                        handleChangeSkinTone(skinTone);
                      }}
                      defaultSkinTone={skinTone}
                      customEmojis={[]}
                      theme={"auto" as Theme}
                    />
                  </div>
                )}

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
                                cursorPos - query.length - 1
                              );
                              const after = message.slice(cursorPos);
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

              {/* Send button hoặc Mic button */}
              {message.trim() ? (
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isUploading}
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full bg-black text-white shadow-sm transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={startRecording}
                        type="button"
                        disabled={isUploading}
                      >
                        <Mic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Hold to record
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            /* Recording UI - giống Messenger */
            <>
              {/* Cancel button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      onClick={cancelRecording}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Cancel
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Recording waveform container */}
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(recordingTime)}
                  </span>
                  <div className="flex-1 flex items-center gap-1 h-8">
                    {/* Fake waveform animation */}
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-full transition-all"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animation: `pulse 0.${
                            Math.floor(Math.random() * 9) + 1
                          }s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stop/Send button */}
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
