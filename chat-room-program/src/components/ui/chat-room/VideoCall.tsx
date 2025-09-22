import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  userId: number;
  peerId: number;
  active: boolean; // bật/tắt call
  onClose: () => void;
}

export const VideoCall = ({
  userId,
  peerId,
  active,
  onClose,
}: VideoCallProps) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      // cleanup khi tắt call
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }

    // tạo kết nối mới khi bắt đầu call
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("iceCandidate", {
          fromUserId: userId,
          toUserId: peerId,
          candidate: event.candidate,
        });
      }
    };

    const init = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // đảm bảo connection còn mở trước khi addTrack
        if (pcRef.current && pcRef.current.signalingState !== "closed") {
          mediaStream.getTracks().forEach((track) => {
            pcRef.current!.addTrack(track, mediaStream);
          });
        }
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    init();

    return () => {
      // cleanup khi component unmount
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex gap-2">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-32 h-24 bg-black rounded"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-64 h-48 bg-black rounded"
        />
      </div>
      <div className="flex justify-center mt-2">
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          End Call
        </button>
      </div>
    </div>
  );
};
