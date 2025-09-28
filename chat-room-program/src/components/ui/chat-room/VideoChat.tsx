/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import * as Video from "twilio-video";
import { Dialog, DialogContent, DialogHeader } from "../dialog";
import { Button } from "../button";
import { Mic, MicOff, Video as VideoIcon, Phone } from "lucide-react";
import { socket } from "./socket";
import type { InComingCallData } from "@/pages/Room";
import { DialogTitle } from "@radix-ui/react-dialog";

interface VideoChatProps {
  identity: number | undefined;
  roomId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  isCommingCall: InComingCallData;
}

export const VideoChat = ({
  isCommingCall,
  identity,
  roomId,
  isOpen,
  onClose,
}: VideoChatProps) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<Video.Room | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const getVideoToken = async () => {
      const res = await axios.get(
        `https://chat-room-be-production.up.railway.app/video/token?identity=${identity}&roomId=${roomId}`
      );

      const token = res.data; // BE trả JWT string
      const joinedRoom = await Video.connect(token, {
        name: roomId,
        audio: true,
        video: { width: 640 },
      });

      if (!active) {
        joinedRoom.disconnect();
        return;
      }

      setRoom(joinedRoom);

      // render local + remote
      attachLocalParticipant(joinedRoom.localParticipant);
      joinedRoom.participants.forEach((p) => attachParticipant(p));

      // listen khi có người join/leave
      joinedRoom.on("participantConnected", (p) => attachParticipant(p));
      joinedRoom.on("participantDisconnected", (p) => detachParticipant(p.sid));

      joinedRoom.on("disconnected", () => {
        joinedRoom.localParticipant.tracks.forEach((pub) => {
          if (pub.track && typeof (pub.track as any).stop === "function") {
            (pub.track as any).stop();
          }
          if (
            pub.track &&
            "detach" in pub.track &&
            typeof pub.track.detach === "function"
          ) {
            pub.track.detach().forEach((el: Element) => el.remove());
          }
        });
        setRoom(null);
      });
    };

    getVideoToken().catch(console.error);

    return () => {
      active = false;
      if (room) room.disconnect();
    };
  }, [identity, roomId, isOpen]);

  function attachLocalParticipant(participant: Video.LocalParticipant) {
    if (!gridRef.current) return;

    const wrapper = document.createElement("div");
    wrapper.id = participant.sid;
    wrapper.className = "participant";

    const label = document.createElement("div");
    label.innerText = `You (${participant.identity})`;
    label.className = "label";
    wrapper.appendChild(label);

    gridRef.current.appendChild(wrapper);

    participant.tracks.forEach((pub) => {
      if (pub.track && "attach" in pub.track) {
        wrapper.appendChild(pub.track.attach());
      }
    });
  }

  function attachParticipant(participant: Video.RemoteParticipant) {
    if (!gridRef.current) return;

    const wrapper = document.createElement("div");
    wrapper.id = participant.sid;
    wrapper.className = "participant";

    const label = document.createElement("div");
    label.innerText = participant.identity;
    label.className = "label";
    wrapper.appendChild(label);

    gridRef.current.appendChild(wrapper);

    participant.tracks.forEach((pub) => {
      if (pub.isSubscribed && pub.track && "attach" in pub.track) {
        wrapper.appendChild(pub.track.attach());
      }
    });

    participant.on("trackSubscribed", (track) => {
      if ("attach" in track) {
        wrapper.appendChild(track.attach());
      }
    });

    participant.on("trackUnsubscribed", (track) => {
      if ("detach" in track) {
        track.detach().forEach((el) => el.remove());
      }
    });
  }

  function detachParticipant(sid: string) {
    document.getElementById(sid)?.remove();
  }

  // Tắt/bật mic
  const toggleMute = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach((publication) => {
        if (publication.track) {
          if (isMuted) {
            publication.track.enable();
          } else {
            publication.track.disable();
          }
        }
      });
      setIsMuted(!isMuted);
    }
  };

  // Kết thúc cuộc gọi
  const endCall = () => {
    if (room) {
      room.disconnect();
    }

    // Emit endCall cho backend
    if (isCommingCall?.callId && identity && roomId) {
      socket.emit("endCall", {
        callId: isCommingCall.callId,
        roomId: Number(roomId),
        userId: identity,
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && endCall()}>
      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>
      <DialogContent className="max-w-6xl h-[80vh] p-0 gap-0 bg-[#1c1e21] border-[#3e4042]">
        {/* Header */}
        <div className="bg-[#242526] border-b border-[#3e4042] p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              📹
            </div>
            <div>
              <h3 className="text-[#e4e6ea] text-base font-semibold m-0 leading-5">
                Room: {roomId}
              </h3>
              <div className="text-[#b0b3b8] text-xs flex items-center gap-2 mt-0.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    room
                      ? "bg-green-500 shadow-green-500/60"
                      : "bg-red-500 shadow-red-500/60"
                  } shadow-lg`}
                />
                {room ? "Connected" : "Connecting..."}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className={`w-10 h-10 rounded-full p-0 ${
                isMuted
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white/10 hover:bg-white/20 text-[#b0b3b8] hover:text-white"
              } transition-all duration-200`}
              title={isMuted ? "Bật mic" : "Tắt mic"}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full p-0 bg-white/10 hover:bg-white/20 text-[#b0b3b8] hover:text-white transition-all duration-200"
              title="Tắt/bật camera"
            >
              <VideoIcon className="h-4 w-4" />
            </Button>

            <Button
              onClick={endCall}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full p-0 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              title="Kết thúc cuộc gọi"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div
            id="video-grid"
            ref={gridRef}
            className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 h-full content-start"
          />
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            .participant {
              position: relative;
              background: #242526;
              border-radius: 16px;
              overflow: hidden;
              aspect-ratio: 16/9;
              border: 2px solid #3e4042;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            .participant:hover {
              border-color: #0099ff;
              transform: scale(1.02);
              box-shadow: 0 4px 16px rgba(0, 153, 255, 0.2);
            }
            
            .participant video {
              width: 100%;
              height: 100%;
              object-fit: cover;
              background: #1c1e21;
            }
            
            .label {
              position: absolute;
              bottom: 12px;
              left: 12px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 6px 10px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 500;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              max-width: calc(100% - 24px);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              z-index: 10;
            }
            
            /* Local participant (You) styling */
            .participant:first-child {
              border-color: #0099ff;
            }
            
            .participant:first-child .label {
              background: rgba(0, 153, 255, 0.9);
              border-color: rgba(0, 153, 255, 0.3);
            }
            
            /* Empty state for participant without video */
            .participant:not(:has(video)) {
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #2d3748, #1a202c);
            }
            
            .participant:not(:has(video))::before {
              content: "👤";
              font-size: 48px;
              opacity: 0.3;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
              #video-grid {
                grid-template-columns: 1fr !important;
                gap: 12px !important;
              }
              
              .participant {
                aspect-ratio: 4/3;
              }
              
              .label {
                bottom: 8px;
                left: 8px;
                padding: 4px 8px;
                font-size: 12px;
                max-width: calc(100% - 16px);
              }
            }
            
            @media (min-width: 1200px) {
              #video-grid {
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
              }
            }
            
            /* Scrollbar styling */
            ::-webkit-scrollbar {
              width: 8px;
            }
            
            ::-webkit-scrollbar-track {
              background: #1c1e21;
            }
            
            ::-webkit-scrollbar-thumb {
              background: #3e4042;
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: #4e5052;
            }
          `,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
