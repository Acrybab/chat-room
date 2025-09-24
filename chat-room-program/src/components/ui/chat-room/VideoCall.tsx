import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  roomId: number;
  userId: number;
  onClose: () => void;
}

interface IncomingCall {
  callId: string;
  fromUserId: number;
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
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [participants, setParticipants] = useState<Set<number>>(new Set());

  // 1️⃣ Init camera/mic
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
  }, []);

  // 2️⃣ Create PeerConnection
  const createPeerConnection = useCallback(
    (remoteUserId: number) => {
      if (peerConnections.has(remoteUserId)) {
        return peerConnections.get(remoteUserId)!;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.ontrack = (event) => {
        console.log("📹 Received remote stream from user:", remoteUserId);
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteUserId]: event.streams[0],
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && currentCallId) {
          socket.emit("iceCandidate", {
            callId: currentCallId,
            fromUserId: userId,
            targetUserId: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(
          `Connection state with ${remoteUserId}:`,
          pc.connectionState
        );
      };

      // Add local stream tracks to peer connection
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      peerConnections.set(remoteUserId, pc);
      return pc;
    },
    [stream, currentCallId, userId, peerConnections]
  );

  // 3️⃣ Socket handlers
  useEffect(() => {
    const handleIncomingCall = (data: IncomingCall) => {
      console.log("📞 Incoming call", data);
      if (!isInCall) {
        // Chỉ nhận call mới nếu chưa trong call
        setIncomingCall(data);
      }
    };

    const handleCallStarted = ({
      callId,
      participants: initialParticipants,
    }: {
      callId: string;
      participants: number[];
    }) => {
      console.log("📞 Call started:", callId);
      setCurrentCallId(callId);
      setIsInCall(true);
      setParticipants(new Set(initialParticipants));
    };

    const handleGroupCallAccepted = async ({
      userId: remoteUserId,
      callId,
    }: {
      userId: number;
      callId: string;
    }) => {
      console.log("✅ User accepted call:", remoteUserId, callId);
      if (remoteUserId === userId || callId !== currentCallId) return;

      const pc = createPeerConnection(remoteUserId);

      // Wait for stream if not ready
      if (!stream) {
        console.log("⏳ Stream not ready, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", {
          callId,
          fromUserId: userId,
          targetUserId: remoteUserId,
          offer,
        });
      } catch (error) {
        console.error("❌ Error creating offer:", error);
      }
    };

    const handleExistingParticipants = async ({
      participants,
      callId,
    }: {
      participants: number[];
      callId: string;
    }) => {
      console.log("👥 Existing participants:", participants);
      if (callId !== currentCallId) return;

      for (const remoteUserId of participants) {
        if (remoteUserId === userId) continue;

        const pc = createPeerConnection(remoteUserId);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtcOffer", {
            callId,
            fromUserId: userId,
            targetUserId: remoteUserId,
            offer,
          });
        } catch (error) {
          console.error(
            "❌ Error creating offer for existing participant:",
            error
          );
        }
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
      console.log("📩 Received offer from:", fromUserId);
      if (fromUserId === userId || callId !== currentCallId) return;

      const pc = createPeerConnection(fromUserId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtcAnswer", {
          callId,
          fromUserId: userId,
          targetUserId: fromUserId,
          answer,
        });
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
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
      console.log("📩 Received answer from:", fromUserId);
      if (fromUserId === userId || callId !== currentCallId) return;

      const pc = peerConnections.get(fromUserId);
      if (!pc) {
        console.error("❌ PeerConnection not found for user:", fromUserId);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
      }
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
      if (!pc) {
        console.error(
          "❌ PeerConnection not found for ICE candidate from:",
          fromUserId
        );
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    };

    const handleParticipantLeft = ({
      userId: remoteUserId,
    }: {
      userId: number;
    }) => {
      console.log("👋 Participant left:", remoteUserId);
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

    const handleCallError = ({ message }: { message: string }) => {
      console.error("❌ Call error:", message);
      alert(`Call error: ${message}`);
    };

    // Register event listeners
    socket.on("incomingGroupCall", handleIncomingCall);
    socket.on("callStarted", handleCallStarted);
    socket.on("groupCallAccepted", handleGroupCallAccepted);
    socket.on("existingParticipants", handleExistingParticipants);
    socket.on("webrtcOffer", handleOffer);
    socket.on("webrtcAnswer", handleAnswer);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("groupParticipantLeft", handleParticipantLeft);
    socket.on("callError", handleCallError);

    return () => {
      socket.off("incomingGroupCall", handleIncomingCall);
      socket.off("callStarted", handleCallStarted);
      socket.off("groupCallAccepted", handleGroupCallAccepted);
      socket.off("existingParticipants", handleExistingParticipants);
      socket.off("webrtcOffer", handleOffer);
      socket.off("webrtcAnswer", handleAnswer);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("groupParticipantLeft", handleParticipantLeft);
      socket.off("callError", handleCallError);
    };
  }, [
    stream,
    currentCallId,
    isInCall,
    userId,
    participants,
    createPeerConnection,
    peerConnections,
  ]);

  // 4️⃣ Start Call
  const handleStartCall = () => {
    if (isInCall) return;

    console.log("🚀 Starting call for room:", roomId);
    socket.emit("startCall", {
      roomId,
      fromUserId: userId,
    });
  };

  // 5️⃣ Accept call
  const handleAccept = () => {
    if (!incomingCall) return;

    console.log("✅ Accepting call", incomingCall.callId);
    setCurrentCallId(incomingCall.callId);
    setIsInCall(true);

    socket.emit("acceptGroupCall", {
      callId: incomingCall.callId,
      fromUserId: userId,
      roomId,
    });

    setIncomingCall(null);
  };

  // 6️⃣ Reject call
  const handleReject = () => {
    if (!incomingCall) return;

    console.log("❌ Rejecting call", incomingCall.callId);
    socket.emit("rejectGroupCall", {
      callId: incomingCall.callId,
      fromUserId: userId,
    });

    setIncomingCall(null);
  };

  // 7️⃣ Cleanup
  const cleanupCall = () => {
    if (currentCallId) {
      socket.emit("leaveCall", {
        callId: currentCallId,
        fromUserId: userId,
      });
    }

    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setRemoteStreams({});
    setCurrentCallId(null);
    setIsInCall(false);
    setParticipants(new Set());
    setParticipants(new Set());
  };

  const handleEndCall = () => {
    cleanupCall();
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50">
      {/* Incoming Call UI */}
      {incomingCall && (
        <div className="mb-4 p-3 bg-blue-600 rounded">
          <p className="text-sm mb-2">
            Incoming call from User {incomingCall.fromUserId}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Start Call Button */}
      {!isInCall && !incomingCall && (
        <div className="mb-2">
          <button
            onClick={handleStartCall}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm w-full"
          >
            Start Video Call
          </button>
        </div>
      )}

      {/* Video Display */}
      {isInCall && (
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Local Video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-32 h-24 bg-black rounded"
            />
            <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 px-1 rounded">
              You
            </span>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([uid, stream]) => (
            <div key={uid} className="relative">
              <video
                autoPlay
                playsInline
                className="w-64 h-48 bg-black rounded"
                ref={(el) => {
                  if (el && el.srcObject !== stream) {
                    el.srcObject = stream;
                  }
                }}
              />
              <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 px-1 rounded">
                User {uid}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Call Controls */}
      {isInCall && (
        <div className="flex justify-center">
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium"
          >
            End Call
          </button>
        </div>
      )}

      {/* Call Status */}
      {isInCall && (
        <div className="text-xs text-gray-300 text-center mt-2">
          Call ID: {currentCallId}
          <br />
          Participants: {participants.size} | Video streams:{" "}
          {Object.keys(remoteStreams).length}
        </div>
      )}
    </div>
  );
};
