"use client";

import {
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MicOff, VideoOff } from "lucide-react";

interface VideoGridProps {
  tracks: TrackReferenceOrPlaceholder[];
}

export default function VideoGrid({ tracks }: VideoGridProps) {
  // Filter to only camera and screen share tracks
  const videoTracks = tracks.filter(
    (track) =>
      track.source === Track.Source.Camera ||
      track.source === Track.Source.ScreenShare
  );

  const getGridClass = () => {
    const count = videoTracks.length;
    if (count === 0) return "";
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  if (videoTracks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoOff className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg">No video streams</p>
          <p className="text-gray-500 text-sm mt-2">
            Enable your camera or wait for others to join
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full grid ${getGridClass()} gap-4 auto-rows-fr`}>
      {videoTracks.map((track) => (
        <ParticipantTile
          key={track.participant.identity + track.source}
          track={track}
        />
      ))}
    </div>
  );
}

interface ParticipantTileProps {
  track: TrackReferenceOrPlaceholder;
}

function ParticipantTile({ track }: ParticipantTileProps) {
  const participant = track.participant;
  const isScreenShare = track.source === Track.Source.ScreenShare;
  const isMicEnabled = participant.isMicrophoneEnabled;
  const isCameraEnabled = participant.isCameraEnabled;
  const hasVideo = isTrackReference(track) && track.publication?.track != null;

  return (
    <div className="relative bg-[#535353] rounded-xl overflow-hidden">
      {hasVideo && isTrackReference(track) ? (
        <VideoTrack 
          trackRef={track} 
          className={`w-full h-full object-cover ${!isScreenShare ? "scale-x-[-1]" : ""}`} 
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#535353]">
          <div className="w-20 h-20 bg-[#3a3a3a] rounded-full flex items-center justify-center">
            <span className="text-3xl font-semibold text-white">
              {participant.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>
      )}

      {/* Name Badge and Status Indicators - Bottom Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-[2px]">
        {/* Name Badge */}
        <div 
          className="flex items-center justify-center px-2.5 h-8 rounded-xl border border-white/[0.05]"
          style={{ 
            backgroundColor: "rgba(30, 30, 30, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)"
          }}
        >
          <span className="text-[15px] text-white/90 font-normal">
            {isScreenShare
              ? `${participant.name}'s screen`
              : participant.name || participant.identity}
          </span>
        </div>

        {/* Mic Status */}
        {!isScreenShare && !isMicEnabled && (
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.05]"
            style={{ 
              backgroundColor: "rgba(30, 30, 30, 0.4)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
          >
            <MicOff className="w-[14px] h-[14px] text-white/90" />
          </div>
        )}

        {/* Camera Status */}
        {!isScreenShare && !isCameraEnabled && (
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.05]"
            style={{ 
              backgroundColor: "rgba(30, 30, 30, 0.4)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
          >
            <VideoOff className="w-[14px] h-[14px] text-white/90" />
          </div>
        )}
      </div>

      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}
