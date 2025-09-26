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
    <div>
      <h3>Room: {roomId}</h3>
      <div
        id="video-grid"
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "8px",
          marginTop: "16px",
        }}
      />
    </div>
  );
};
