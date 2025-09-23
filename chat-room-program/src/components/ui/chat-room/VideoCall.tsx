import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  roomId: number;
  userId: number;
  onClose: () => void;
}

export const VideoCall = ({ roomId, userId, onClose }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerConnections] = useState<Map<number, RTCPeerConnection>>(
    () => new Map()
  );
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [stream, setStream] = useState<MediaStream | null>(null);

  // tạo PeerConnection cho 1 user
  const createPeerConnection = (remoteUserId: number) => {
    if (peerConnections.has(remoteUserId))
      return peerConnections.get(remoteUserId)!;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // remote track
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteUserId]: event.streams[0],
      }));
    };

    // ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          roomId,
          fromUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    // add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    peerConnections.set(remoteUserId, pc);
    return pc;
  };

  // lấy camera/mic
  useEffect(() => {
    const init = async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(media);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = media;
        }
      } catch (err) {
        console.error("❌ Error initStream:", err);
      }
    };
    init();

    return () => {
      cleanupCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // socket events
  useEffect(() => {
    // Khi có user accept call → tạo offer cho họ
    socket.on("groupCallAccepted", async ({ userId: remoteUserId }) => {
      if (remoteUserId === userId) return;
      const pc = createPeerConnection(remoteUserId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtcOffer", { roomId, fromUserId: userId, offer });
    });

    // Nhận danh sách participants khi mình accept call
    socket.on("existingParticipants", async ({ participants }) => {
      for (const remoteUserId of participants) {
        const pc = createPeerConnection(remoteUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", { roomId, fromUserId: userId, offer });
      }
    });

    // Nhận offer
    socket.on("webrtcOffer", async ({ fromUserId, offer }) => {
      if (fromUserId === userId) return;
      const pc = createPeerConnection(fromUserId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtcAnswer", { roomId, fromUserId: userId, answer });
    });

    // Nhận answer
    socket.on("webrtcAnswer", async ({ fromUserId, answer }) => {
      if (fromUserId === userId) return;
      const pc = peerConnections.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Nhận ICE
    socket.on("iceCandidate", async ({ fromUserId, candidate }) => {
      if (fromUserId === userId) return;
      const pc = peerConnections.get(fromUserId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("❌ Error adding ICE", err);
      }
    });

    // Khi user rời call
    socket.on("groupParticipantLeft", ({ userId: remoteUserId }) => {
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[remoteUserId];
        return copy;
      });
      const pc = peerConnections.get(remoteUserId);
      if (pc) {
        pc.close();
        peerConnections.delete(remoteUserId);
      }
    });

    return () => {
      socket.off("groupCallAccepted");
      socket.off("existingParticipants");
      socket.off("webrtcOffer");
      socket.off("webrtcAnswer");
      socket.off("iceCandidate");
      socket.off("groupParticipantLeft");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  // cleanup
  const cleanupCall = () => {
    socket.emit("leaveCall", { roomId, fromUserId: userId });

    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex flex-wrap gap-2">
        {/* Local video */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-32 h-24 bg-black rounded"
        />
        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([uid, s]) => (
          <video
            key={uid}
            autoPlay
            playsInline
            className="w-64 h-48 bg-black rounded"
            ref={(el) => {
              if (el) el.srcObject = s;
            }}
          />
        ))}
      </div>
      <div className="flex justify-center mt-2">
        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          End Call
        </button>
      </div>
    </div>
  );
};
