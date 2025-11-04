import React, { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { Button } from "../button";
import {
  Paperclip,
  Send,
  Smile,
  Loader2,
  Mic,
  X,
  Pause,
  Play,
} from "lucide-react";
import { Textarea } from "../textarea";
import type { MeResponse } from "@/types/chatRoom.types";
import { socket } from "./socket";
import type { OnlineUser } from "@/store/room.store";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { SkinTones } from "emoji-picker-react";
import { getToken } from "@/lib/cookies";
import axios from "axios";

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
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
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

      const responseFromAI = await axios.post(
        `https://api.dify.ai/v1/audio-to-text`,
        formData,
        {
          headers: {
            Authorization: `Bearer app-Pr1pAnU3MhSw1EocZZX0JYhw`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Transcription result:", responseFromAI.data);

      const fileUrl = data.fileUrl;

      // Gửi socket như cũ
      socket.emit("sendFileMessage", {
        roomId: Number(roomId),
        userId: userData.data.user.id,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: file.type,
      });
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
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

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const sendVoiceMessage = async () => {
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
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error("❌ Error sending voice message:", error);
      alert("Không thể gửi tin nhắn thoại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteVoiceMessage = () => {
    setAudioBlob(null);
    setRecordingTime(0);
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

        {/* Recording Interface */}
        {isRecording && (
          <div className="mb-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isPaused ? "Đã tạm dừng" : "Đang ghi âm"}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"
                        onClick={cancelRecording}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hủy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={isPaused ? resumeRecording : pauseRecording}
                      >
                        {isPaused ? (
                          <Play className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPaused ? "Tiếp tục" : "Tạm dừng"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={stopRecording}
                >
                  Dừng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Recorded Audio */}
        {audioBlob && !isRecording && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Mic className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Tin nhắn thoại
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"
                        onClick={deleteVoiceMessage}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Xóa</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={sendVoiceMessage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Gửi"
                  )}
                </Button>
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
                  disabled={isUploading || isRecording || !!audioBlob}
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

          {/* Voice recording button - chỉ hiện khi không đang ghi âm hoặc có audio preview */}
          {!isRecording && !audioBlob && (
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
                  Ghi âm
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Message input container - ẩn khi đang ghi âm hoặc có audio preview */}
          {!isRecording && !audioBlob && (
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
              {/* Send button */}
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isUploading}
                size="icon"
                className={`h-9 w-9 shrink-0 rounded-full transition-all ${
                  message.trim() && !isUploading
                    ? "bg-black text-white shadow-sm"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
