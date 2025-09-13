import React, { useEffect, useRef, useState } from "react";
import { socket } from "./socket";

interface VideoCallProps {
  userId: number;
  roomId: number;
}

const VideoCall: React.FC<VideoCallProps> = ({ userId, roomId }) => {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [incomingCall, setIncomingCall] = useState<{
    fromUserId: number;
    offer: RTCSessionDescriptionInit;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideosRef = useRef<{ [key: number]: HTMLVideoElement | null }>(
    {}
  );
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [key: number]: RTCPeerConnection }>({});

  // ICE servers configuration
  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Create peer connection
  const createPeerConnection = (targetUserId: number) => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnections.current[targetUserId] = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          fromUserId: userId,
          toUserId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteVideo = remoteVideosRef.current[targetUserId];
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.play().catch((err) => {
          console.error("Remote play error:", err);
        });
      }
    };

    // Add local stream tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current!);
      });
    }

    return pc;
  };

  // Start video call
  const startCall = async () => {
    try {
      // Get user media
      if (!localStream.current) {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
          await localVideoRef.current.play().catch((err) => {
            console.error("Local play error:", err);
          });
        }
      }

      // Join room first
      socket.emit("joinRoom", { userId, roomId });
      setInCall(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone");
    }
  };

  // Call specific user
  const callUser = async (targetUserId: number) => {
    if (!localStream.current) return;

    const pc = createPeerConnection(targetUserId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        fromUserId: userId,
        toUserId: targetUserId,
        offer: offer,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !localStream.current) return;

    const pc = createPeerConnection(incomingCall.fromUserId);

    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        fromUserId: userId,
        toUserId: incomingCall.fromUserId,
        answer: answer,
      });

      setIncomingCall(null);
    } catch (error) {
      console.error("Error answering call:", error);
    }
  };

  // Decline call
  const declineCall = () => {
    setIncomingCall(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // End call
  const endCall = () => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    // Reset states
    setInCall(false);
    setRemoteUsers([]);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
  };

  // Socket event listeners
  useEffect(() => {
    if (!inCall) return;

    // User joined room
    socket.on("userJoined", ({ userId: joinedUserId }) => {
      console.log("User joined:", joinedUserId);
      if (joinedUserId !== userId) {
        setRemoteUsers((prev) => [
          ...prev.filter((id) => id !== joinedUserId),
          joinedUserId,
        ]);
        // Automatically call the new user
        setTimeout(() => callUser(joinedUserId), 1000);
      }
    });

    // User left room
    socket.on("userLeft", ({ userId: leftUserId }) => {
      console.log("User left:", leftUserId);
      setRemoteUsers((prev) => prev.filter((id) => id !== leftUserId));

      // Close peer connection
      if (peerConnections.current[leftUserId]) {
        peerConnections.current[leftUserId].close();
        delete peerConnections.current[leftUserId];
      }
    });

    // Room users list
    socket.on("roomUsers", ({ users }) => {
      console.log("Room users:", users);
      const otherUsers = users.filter((id: number) => id !== userId);
      setRemoteUsers(otherUsers);
    });

    // Incoming call
    socket.on("incomingCall", ({ fromUserId, offer }) => {
      console.log("Incoming call from:", fromUserId);
      setIncomingCall({ fromUserId, offer });
    });

    // Call answered
    socket.on("callAnswered", async ({ fromUserId, answer }) => {
      console.log("Call answered by:", fromUserId);
      const pc = peerConnections.current[fromUserId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });

    // ICE candidate
    socket.on("iceCandidate", async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current[fromUserId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("roomUsers");
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("iceCandidate");
    };
  }, [inCall, userId, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="w-full h-full">
      {!inCall ? (
        <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 max-w-md mx-4">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
              Start Video Call
            </h2>
            <p className="text-gray-600 mb-8">
              Connect with your team in Room {roomId}
            </p>
            <button
              onClick={startCall}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Join Call</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-medium">Room {roomId}</span>
              <div className="px-3 py-1 bg-white/10 rounded-full">
                <span className="text-white text-sm">
                  {remoteUsers.length + 1} participants
                </span>
              </div>
            </div>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              Leave Call
            </button>
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-6 overflow-auto">
            <div
              className={`grid gap-4 h-full ${
                remoteUsers.length === 0
                  ? "grid-cols-1"
                  : remoteUsers.length === 1
                  ? "grid-cols-2"
                  : remoteUsers.length <= 4
                  ? "grid-cols-2 grid-rows-2"
                  : "grid-cols-3 auto-rows-fr"
              }`}
            >
              {/* Local Video */}
              <div className="relative group bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-2 border-blue-400/50">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Camera Off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full border border-white/20">
                  You (User {userId})
                </div>
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  LOCAL
                </div>
              </div>

              {/* Remote Videos */}
              {remoteUsers.map((remoteUserId) => (
                <div
                  key={remoteUserId}
                  className="relative group bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-300"
                >
                  <video
                    ref={(el) => {
                      remoteVideosRef.current[remoteUserId] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full border border-white/20">
                    User {remoteUserId}
                  </div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    LIVE
                  </div>
                </div>
              ))}

              {/* Empty state for remote users */}
              {remoteUsers.length === 0 && (
                <div className="flex items-center justify-center bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-600">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg font-medium">
                      Waiting for others
                    </p>
                    <p className="text-gray-500 text-sm">
                      Share room {roomId} to invite people
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 bg-black/20 backdrop-blur-lg border-t border-white/10">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMuted ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  )}
                </svg>
              </button>

              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg ${
                  !isVideoEnabled
                    ? "bg-gray-500 hover:bg-gray-600 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isVideoEnabled ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636"
                    />
                  )}
                </svg>
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-2xl flex items-center justify-center text-white transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.664 1.664M21 21l-1.664-1.664M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-md w-full mx-4 animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Incoming Video Call
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              <span className="font-semibold text-blue-600">
                User {incomingCall.fromUserId}
              </span>{" "}
              is calling you
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={acceptCall}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Accept</span>
              </button>
              <button
                onClick={declineCall}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
