import { useEffect, useRef } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  userId: number;
  roomId: number;
  active: boolean;
  onClose: () => void;
  stream: MediaStream | null;
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  remoteStreams: Record<number, MediaStream>;
  setRemoteStreams: React.Dispatch<
    React.SetStateAction<Record<number, MediaStream>>
  >;
  peerConnections: React.MutableRefObject<Map<number, RTCPeerConnection>>;
}

export const VideoCall = ({
  userId,
  roomId,
  active,
  onClose,
  peerConnections,
  remoteStreams,
  setRemoteStreams,
  stream,
  setStream,
}: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // ====== INIT CALL ======
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

        // báo server mình đã startCall
        socket.emit("startCall", { roomId, fromUserId: userId });
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    init();

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

  // ====== HANDLERS ======
  const createPeerConnection = (peerId: number) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // add local stream
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // remote stream
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: event.streams[0],
      }));
    };

    // ice candidate
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
    return pc;
  };

  // ====== SOCKET LISTENERS ======
  useEffect(() => {
    if (!active) return;

    // khi có user start call
    socket.on("incomingGroupCall", ({ fromUserId }) => {
      if (fromUserId === userId) return; // ignore self

      const pc = createPeerConnection(fromUserId);

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit("offerToRoom", { roomId, fromUserId: userId, offer });
      });
    });

    // khi nhận được offer
    socket.on("offerFromUser", async ({ fromUserId, offer }) => {
      if (fromUserId === userId) return;
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answerToRoom", { roomId, fromUserId: userId, answer });
    });

    // khi nhận được answer
    socket.on("answerFromUser", async ({ fromUserId, answer }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // khi nhận ICE
    socket.on("iceCandidateFromUser", async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE", err);
        }
      }
    });

    return () => {
      socket.off("incomingGroupCall");
      socket.off("offerFromUser");
      socket.off("answerFromUser");
      socket.off("iceCandidateFromUser");
    };
  }, [active, stream]);

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
