/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import * as Video from "twilio-video";
interface VideoChatProps {
  identity: number | undefined;
  roomId: string | undefined;
}

export const VideoChat = ({ identity, roomId }: VideoChatProps) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const remoteRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<Video.Room | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  useEffect(() => {
    let active = true;

    const getVideoToken = async () => {
      const response = await axios.get(
        `https://chat-room-be-production.up.railway.app/video/token?identity=${identity}&roomId=${roomId}`
      );
      console.log(response.data, "video token");
      const videoToken = response.data;
      const room = await Video.connect(videoToken, {
        name: roomId,
        audio: true,
        video: { width: 640 },
      });
      if (!active) {
        room?.disconnect();
        return;
      }

      setRoom(room);
      attachLocalTracks(room);
      room.participants.forEach((p) => attachParticipant(p));
      room.on("participantConnected", (p) => attachParticipant(p));
      room.on("participantDisconnected", (p) => detachParticipant(p));
      room.on("disconnected", () => {
        room.localParticipant.tracks.forEach(
          (pub: Video.LocalTrackPublication) => {
            const track = pub.track;
            if (
              track &&
              (track.kind === "video" || track.kind === "audio") &&
              typeof (track as Video.LocalVideoTrack | Video.LocalAudioTrack)
                .detach === "function"
            ) {
              (track as Video.LocalVideoTrack | Video.LocalAudioTrack)
                .detach()
                .forEach((el) => el.remove());
            }
          }
        );
        setRoom(null);
      });
    };
    getVideoToken().catch(console.error);

    return () => {
      active = false;
      if (room) room.disconnect();
    };
  }, [identity, roomId]);
  function attachLocalTracks(room: Video.Room) {
    if (!localRef.current) return;
    localRef.current.innerHTML = "";
    room.localParticipant.tracks.forEach((pub) => {
      const track = pub.track;
      if (
        track &&
        (track.kind === "video" || track.kind === "audio") &&
        typeof track.attach === "function"
      ) {
        localRef.current!.appendChild(track.attach());
      }
    });
  }
  function detachParticipant(participant: Video.RemoteParticipant) {
    document.getElementById(participant.sid)?.remove();
  }
  function attachParticipant(participant: Video.RemoteParticipant) {
    if (!remoteRef.current) return;

    const wrapper = document.createElement("div");
    wrapper.id = participant.sid;
    wrapper.style.border = "1px solid #ddd";
    wrapper.style.margin = "4px";
    wrapper.style.padding = "4px";

    const label = document.createElement("div");
    label.innerText = participant.identity;
    label.style.fontSize = "12px";
    wrapper.appendChild(label);

    remoteRef.current.appendChild(wrapper);

    participant.tracks.forEach((pub) => {
      if (pub.isSubscribed) {
        const track = pub.track as Video.RemoteTrack;
        if (
          track &&
          (track.kind === "video" || track.kind === "audio") &&
          typeof (track as any).attach === "function"
        ) {
          wrapper.appendChild(
            (track as Video.RemoteVideoTrack | Video.RemoteAudioTrack).attach()
          );
        }
      }
    });

    participant.on("trackSubscribed", (track: Video.RemoteTrack) => {
      if (
        (track.kind === "video" || track.kind === "audio") &&
        typeof (track as any).attach === "function"
      ) {
        wrapper.appendChild(
          (track as Video.RemoteVideoTrack | Video.RemoteAudioTrack).attach()
        );
      }
    });

    participant.on("trackUnsubscribed", (track: Video.RemoteTrack) => {
      if (
        (track.kind === "video" || track.kind === "audio") &&
        typeof (track as Video.RemoteVideoTrack | Video.RemoteAudioTrack)
          .detach === "function"
      ) {
        (track as Video.RemoteVideoTrack | Video.RemoteAudioTrack)
          .detach()
          .forEach((el) => el.remove());
      }
    });
  }
  function toggleVideo() {
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      if (pub.track) {
        isVideoEnabled ? pub.track.disable() : pub.track.enable();
      }
    });
    setIsVideoEnabled(!isVideoEnabled);
  }

  function toggleAudio() {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      if (pub.track) {
        isAudioEnabled ? pub.track.disable() : pub.track.enable();
      }
    });
    setIsAudioEnabled(!isAudioEnabled);
  }
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={toggleVideo}>
          {isVideoEnabled ? "Turn Video Off" : "Turn Video On"}
        </button>
        <button onClick={toggleAudio} style={{ marginLeft: 8 }}>
          {isAudioEnabled ? "Mute" : "Unmute"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div>
          <h4>Local</h4>
          <div
            ref={localRef}
            style={{ width: 320, height: 240, background: "#eee" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h4>Remote</h4>
          <div
            ref={remoteRef}
            style={{ minHeight: 240, background: "#fafafa" }}
          />
        </div>
      </div>
    </div>
  );
};
