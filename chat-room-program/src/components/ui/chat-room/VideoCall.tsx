/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  userId: number;
  roomId: number;
  active: boolean; // bật/tắt call
  onClose: () => void;
}

export const VideoCall = ({
  userId,
  roomId,
  active,
  onClose,
}: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Lưu tất cả peer connections theo userId
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!active) {
      cleanup();
      return;
    }

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

        // thông báo cho room rằng user này đã join call
        socket.emit("startCall", { roomId, fromUserId: userId });
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    init();

    // cleanup khi unmount
    return () => cleanup();
  }, [active]);

  const cleanup = () => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setRemoteStreams({});
  };

  // ====== Socket listeners ======
  useEffect(() => {
    if (!active) return;

    // Có người trong room phát tín hiệu start call
    socket.on("incomingGroupCall", ({ fromUserId }: { fromUserId: number }) => {
      console.log(`📞 Incoming call in room ${roomId} from ${fromUserId}`);
      createPeerConnection(fromUserId, true);
    });

    socket.on("offerFromUser", async (data: any) => {
      const { fromUserId, offer } = data;
      console.log(`📩 Offer from ${fromUserId}`);
      const pc = createPeerConnection(fromUserId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerToRoom", { roomId, fromUserId: userId, answer });
    });

    socket.on("answerFromUser", async (data: any) => {
      const { fromUserId, answer } = data;
      console.log(`📩 Answer from ${fromUserId}`);
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidateFromUser", async (data: any) => {
      const { fromUserId, candidate } = data;
      const pc = peerConnections.current.get(fromUserId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("incomingGroupCall");
      socket.off("offerFromUser");
      socket.off("answerFromUser");
      socket.off("iceCandidateFromUser");
    };
  }, [active, stream]);

  // ====== Helper to create peer connection ======
  const createPeerConnection = (peerId: number, isInitiator: boolean) => {
    if (peerConnections.current.has(peerId)) {
      return peerConnections.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // khi nhận track từ peer
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: event.streams[0],
      }));
    };

    // ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidateToRoom", {
          roomId,
          fromUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    peerConnections.current.set(peerId, pc);

    if (isInitiator) {
      // tạo offer và gửi
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit("offerToRoom", { roomId, fromUserId: userId, offer });
      });
    }

    return pc;
  };

  if (!active) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50 w-[600px]">
      <div className="grid grid-cols-2 gap-2">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-40 bg-black rounded"
        />
        {Object.entries(remoteStreams).map(([peerId, s]) => (
          <video
            key={peerId}
            autoPlay
            playsInline
            className="w-full h-40 bg-black rounded"
            ref={(el) => {
              if (el) el.srcObject = s;
            }}
          />
        ))}
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
