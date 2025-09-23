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
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [peerConnections] = useState<Map<number, RTCPeerConnection>>(
    () => new Map()
  );
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [acceptedCalls, setAcceptedCalls] = useState<string[]>([]); // changed Set -> Array

  // 1️⃣ Init camera/mic
  useEffect(() => {
    const init = async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(media);
        if (localVideoRef.current) localVideoRef.current.srcObject = media;
      } catch (err) {
        console.error("❌ Error initStream:", err);
      }
    };
    init();

    return cleanupCall;
  }, []);

  // 2️⃣ Create PeerConnection
  const createPeerConnection = (remoteUserId: number) => {
    if (peerConnections.has(remoteUserId))
      return peerConnections.get(remoteUserId)!;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteUserId]: event.streams[0],
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          roomId,
          fromUserId: userId,
          targetUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    if (stream)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    peerConnections.set(remoteUserId, pc);
    return pc;
  };

  // 3️⃣ Socket handlers
  useEffect(() => {
    const handleIncomingCall = (data: IncomingCall) => {
      if (
        data.pending.includes(userId) &&
        !acceptedCalls.includes(data.callId)
      ) {
        console.log("📞 Incoming call", data);
        setIncomingCall(data);
      }
    };

    const handleGroupCallAccepted = async ({
      userId: remoteUserId,
      callId,
    }: {
      userId: number;
      callId: string;
    }) => {
      console.log("✅ group call accepted", remoteUserId, callId);
      if (remoteUserId === userId) return;
      const pc = createPeerConnection(remoteUserId);
      if (!pc) return;

      // Nếu stream chưa có, chờ stream sẵn sàng
      if (!stream) {
        console.log("⏳ Stream chưa sẵn sàng, chờ 500ms...");
        await new Promise((res) => setTimeout(res, 500));
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtcOffer", {
        roomId,
        fromUserId: userId,
        targetUserId: remoteUserId,
        callId,
        offer,
      });
    };

    const handleExistingParticipants = async ({
      participants,
      callId,
    }: {
      participants: number[];
      callId: string;
    }) => {
      console.log(callId, "existing participants", participants);
      if (!acceptedCalls.includes(callId)) return;
      for (const remoteUserId of participants) {
        if (remoteUserId === userId) continue;
        const pc = createPeerConnection(remoteUserId);
        if (!pc) continue;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", {
          roomId,
          fromUserId: userId,
          targetUserId: remoteUserId,
          callId,
          offer,
        });
      }
    };

    const handleOffer = async ({
      fromUserId,
      callId,
      offer,
    }: {
      fromUserId: number;
      callId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      if (fromUserId === userId) return;
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtcAnswer", {
        roomId,
        fromUserId: userId,
        targetUserId: fromUserId,
        callId,
        answer,
      });
    };

    const handleAnswer = async ({
      fromUserId,
      callId,
      answer,
    }: {
      fromUserId: number;
      callId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (fromUserId === userId) return;
      const pc = peerConnections.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({
      fromUserId,
      candidate,
    }: {
      fromUserId: number;
      candidate: RTCIceCandidateInit;
    }) => {
      if (fromUserId === userId) return;
      const pc = peerConnections.get(fromUserId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("❌ Error adding ICE", err);
      }
    };

    const handleParticipantLeft = ({
      userId: remoteUserId,
    }: {
      userId: number;
    }) => {
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
    };

    socket.on("incomingGroupCall", handleIncomingCall);
    socket.on("groupCallAccepted", handleGroupCallAccepted);
    socket.on("existingParticipants", handleExistingParticipants);
    socket.on("webrtcOffer", handleOffer);
    socket.on("webrtcAnswer", handleAnswer);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("groupParticipantLeft", handleParticipantLeft);

    return () => {
      socket.off("incomingGroupCall", handleIncomingCall);
      socket.off("groupCallAccepted", handleGroupCallAccepted);
      socket.off("existingParticipants", handleExistingParticipants);
      socket.off("webrtcOffer", handleOffer);
      socket.off("webrtcAnswer", handleAnswer);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("groupParticipantLeft", handleParticipantLeft);
    };
  }, [
    stream,
    acceptedCalls,
    userId,
    createPeerConnection,
    roomId,
    peerConnections,
  ]);

  // 4️⃣ Accept call
  const handleAccept = () => {
    if (!incomingCall) return;
    console.log("✅ Accepting call", incomingCall);

    socket.emit("acceptGroupCall", {
      roomId,
      fromUserId: userId,
      callId: incomingCall.callId,
    });

    setAcceptedCalls((prev) => [...prev, incomingCall.callId]);
    setIncomingCall(null);
  };

  // 5️⃣ Cleanup
  const cleanupCall = () => {
    socket.emit("leaveCall", { roomId, fromUserId: userId });
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const handleEndCall = () => {
    cleanupCall();
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50">
      {incomingCall && (
        <div className="mb-2">
          <button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            Accept Call
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-32 h-24 bg-black rounded"
        />
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
