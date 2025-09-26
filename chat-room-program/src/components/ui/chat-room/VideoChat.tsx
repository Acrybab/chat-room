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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: room
                ? "linear-gradient(45deg, #00ff87, #60efff)"
                : "#ff6b6b",
              boxShadow: room
                ? "0 0 20px rgba(0, 255, 135, 0.5)"
                : "0 0 20px rgba(255, 107, 107, 0.5)",
              animation: "pulse 2s infinite",
            }}
          />
          <h3
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: "700",
              margin: 0,
              textAlign: "center",
              textShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
              letterSpacing: "-0.5px",
            }}
          >
            Room: {roomId}
          </h3>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255, 255, 255, 0.15)",
              padding: "8px 16px",
              borderRadius: "20px",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {room ? `Connected` : "Connecting..."}
          </div>
        </div>

        <div
          id="video-grid"
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "16px",
          }}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
            50% { opacity: 0.7; transform: translateY(-50%) scale(1.1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          
          .participant {
            position: relative;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 16px;
            border: 2px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            animation: fadeIn 0.5s ease-out;
          }
          
          .participant:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
          
          .participant video {
            width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            background: #1a1a2e;
          }
          
          .label {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            letter-spacing: 0.3px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            z-index: 10;
          }
          
          .participant:first-child .label {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.8));
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          /* Responsive design */
          @media (max-width: 768px) {
            #video-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            
            .participant {
              padding: 12px;
            }
            
            .label {
              bottom: 16px;
              left: 16px;
              right: 16px;
              padding: 10px 14px;
              font-size: 13px;
            }
          }
          
          /* Beautiful scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `,
        }}
      />
    </div>
  );
};
