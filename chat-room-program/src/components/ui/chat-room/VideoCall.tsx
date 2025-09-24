import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  roomId: number;
  userId: number;
  onClose: () => void;
}

interface IncomingCall {
  callId: string;
  fromUserId: number;
  pending: number[];
}

export const VideoCall = ({ roomId, userId, onClose }: VideoCallProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());

  // ==============================
  // Init media
  // ==============================
  const initMedia = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(localStream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  // ==============================
  // Cleanup call
  // ==============================
  const cleanupCall = () => {
    console.log("Cleaning up call");

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setRemoteStreams([]);
    setIncomingCall(null);
  };

  // ==============================
  // Peer connection
  // ==============================
  const createPeerConnection = (participantId: number) => {
    const pc = new RTCPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => [...prev, event.streams[0]]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          roomId,
          fromUserId: userId,
          toUserId: participantId,
          candidate: event.candidate,
        });
      }
    };

    peerConnections.current.set(participantId, pc);
    return pc;
  };

  // ==============================
  // Handlers
  // ==============================
  const handleStartCall = () => {
    socket.emit("startCall", { roomId, userId });
  };

  const handleAcceptCall = (callId: string) => {
    socket.emit("acceptGroupCall", { callId, roomId, userId });
    setIncomingCall(null);
  };

  const handleRejectCall = (callId: string) => {
    socket.emit("rejectGroupCall", { callId, roomId, userId });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    socket.emit("leaveCall", { roomId, userId });
    cleanupCall();
    onClose();
  };

  // ==============================
  // Effects
  // ==============================
  useEffect(() => {
    // auto init camera khi join room
    initMedia();

    // socket listeners
    socket.on("incomingGroupCall", ({ callId, fromUserId, pending }) => {
      setIncomingCall({ callId, fromUserId, pending });
    });

    socket.on("callStarted", ({ callId, participants }) => {
      console.log("Call started with ID:", callId);
      participants.forEach((p: number) => {
        if (p !== userId) createPeerConnection(p);
      });
    });

    socket.on(
      "groupCallAccepted",
      async ({ callId, userId: participantId }) => {
        const pc = createPeerConnection(participantId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", {
          callId,
          fromUserId: userId,
          toUserId: participantId,
          offer,
        });
      }
    );

    socket.on("existingParticipants", async ({ callId, participants }) => {
      participants.forEach(async (participantId: number) => {
        const pc = createPeerConnection(participantId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", {
          callId,
          fromUserId: userId,
          toUserId: participantId,
          offer,
        });
      });
    });

    socket.on("webrtcOffer", async ({ fromUserId, offer }) => {
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtcAnswer", {
        fromUserId: userId,
        toUserId: fromUserId,
        answer,
      });
    });

    socket.on("webrtcAnswer", async ({ fromUserId, answer }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidate", async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("callEnded", ({ callId }) => {
      console.log("Call ended:", callId);
      cleanupCall();
    });

    // cleanup when unmount
    return () => {
      cleanupCall();
      socket.off("incomingGroupCall");
      socket.off("callStarted");
      socket.off("groupCallAccepted");
      socket.off("existingParticipants");
      socket.off("webrtcOffer");
      socket.off("webrtcAnswer");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, []);

  // ==============================
  // Render
  // ==============================
  return (
    <div>
      <h2>Video Call</h2>
      {stream && (
        <video
          autoPlay
          playsInline
          muted
          ref={(v) => {
            if (v) v.srcObject = stream;
          }}
        />
      )}
      {remoteStreams.map((s, i) => (
        <video
          key={i}
          autoPlay
          playsInline
          ref={(v) => {
            if (v) v.srcObject = s;
          }}
        />
      ))}

      <button onClick={handleStartCall}>Start Call</button>
      {incomingCall && (
        <div>
          <p>
            Incoming call from user {incomingCall.fromUserId}, pending:{" "}
            {incomingCall.pending.join(", ")}
          </p>
          <button onClick={() => handleAcceptCall(incomingCall.callId)}>
            Accept
          </button>
          <button onClick={() => handleRejectCall(incomingCall.callId)}>
            Reject
          </button>
        </div>
      )}
      <button onClick={handleEndCall}>End Call</button>
    </div>
  );
};
