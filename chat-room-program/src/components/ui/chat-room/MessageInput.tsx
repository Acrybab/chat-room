/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import axios from "axios";
import { Mic, Send } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  roomId: string | undefined;
  userData: any;
  handleTyping: () => void;
  onlineUsers: any[];
  roomName: string | undefined;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  inputRef,
  handleSendMessage,
  handleKeyPress,
  // roomId,
  // userData,
  handleTyping,
  // onlineUsers,
  // roomName,
}) => {
  // ==== Thêm các state phục vụ cho ghi âm + gọi Dify ====
  const [recording, setRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_KEY = "app-Pr1pAnU3MhSw1EocZZX0JYhw"; // 🔑 thay bằng API key của bạn
  const API_URL = "https://api.dify.ai/v1/audio-to-text";

  // 🎙️ Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        await convertSpeechToText(audioBlob); // 🧠 gọi Dify API
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Không thể truy cập micro: " + (err as Error).message);
    }
  };

  // 🛑 Dừng ghi âm
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // 📤 Gửi file audio đến Dify Speech-to-Text
  const convertSpeechToText = async (audioBlob: Blob) => {
    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");
      formData.append("user", "user_01");

      const res = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const transcribedText = res.data.text || "";
      if (transcribedText) {
        setMessage(transcribedText);
      } else {
        alert("Không nhận diện được nội dung giọng nói!");
      }
    } catch (err) {
      console.error("Speech-to-Text Error:", err);
      alert("Lỗi khi gửi dữ liệu âm thanh lên Dify!");
    } finally {
      setIsConverting(false);
    }
  };

  // ==== JSX gốc của bạn, thêm button micro vào ====
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-end gap-3">
          {/* 🎤 Micro button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={recording ? "default" : "ghost"}
                  size="icon"
                  className={`h-9 w-9 shrink-0 rounded-full transition-colors ${
                    recording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={recording ? stopRecording : startRecording}
                  type="button"
                >
                  <Mic
                    className={`h-4 w-4 ${
                      recording
                        ? "text-white animate-pulse"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {recording ? "Đang ghi..." : "Nhấn để nói"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* ✏️ Ô nhập tin nhắn */}
          <Textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onInput={handleTyping}
            placeholder={
              isConverting
                ? "🎧 Đang nhận dạng giọng nói..."
                : "Nhập tin nhắn hoặc nhấn micro để nói..."
            }
            className="flex-1 min-h-[44px] max-h-[160px] resize-none rounded-2xl px-4 py-2 border-gray-300 dark:border-gray-700"
            disabled={isConverting}
          />

          {/* 📤 Nút gửi tin nhắn */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleSendMessage}
            disabled={!message.trim() || isConverting}
          >
            <Send className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {isConverting && (
          <p className="text-sm text-gray-500 mt-2">
            ⏳ Đang gửi lên Dify để chuyển giọng nói thành văn bản...
          </p>
        )}
      </div>
    </div>
  );
};
