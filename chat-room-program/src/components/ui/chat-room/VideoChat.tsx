/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import * as Video from "twilio-video";
interface VideoChatProps {
  identity: number | undefined;
  roomId: string | undefined;
}

export const VideoChat = ({ identity, roomId }: VideoChatProps) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<Video.Room | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
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
  }, [identity, roomId]);

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
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1c1e21",
        padding: "0",
        fontFamily: "Helvetica, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header giống Messenger */}
      <div
        style={{
          background: "#242526",
          borderBottom: "1px solid #3e4042",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(45deg, #0099ff, #0078d4)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            📹
          </div>
          <div>
            <h3
              style={{
                color: "#e4e6ea",
                fontSize: "16px",
                fontWeight: "600",
                margin: 0,
                lineHeight: "20px",
              }}
            >
              Room: {roomId}
            </h3>
            <div
              style={{
                color: "#b0b3b8",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: room ? "#42b883" : "#ff4757",
                  boxShadow: room
                    ? "0 0 8px rgba(66, 184, 131, 0.6)"
                    : "0 0 8px rgba(255, 71, 87, 0.6)",
                }}
              />
              {room ? "Connected" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Action buttons giống Messenger */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={toggleMute}
            style={{
              background: isMuted ? "#e41e3f" : "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: isMuted ? "white" : "#b0b3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isMuted)
                (e.target as HTMLElement).style.background =
                  "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              if (!isMuted)
                (e.target as HTMLElement).style.background =
                  "rgba(255, 255, 255, 0.1)";
            }}
            title={isMuted ? "Bật mic" : "Tắt mic"}
          >
            {isMuted ? "🔇" : "🎤"}
          </button>
          <button
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: "#b0b3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.background =
                "rgba(255, 255, 255, 0.2)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.background =
                "rgba(255, 255, 255, 0.1)")
            }
            title="Tắt/bật camera"
          >
            📷
          </button>
          <button
            onClick={endCall}
            style={{
              background: "#e41e3f",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background = "#d11a36")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background = "#e41e3f")
            }
            title="Kết thúc cuộc gọi"
          >
            📞
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflow: "auto",
        }}
      >
        <div
          id="video-grid"
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            height: "100%",
            alignContent: "start",
          }}
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
    </div>
  );
};
