"use client";

import {
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, VideoOff } from "lucide-react";

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
  const hasVideo = isTrackReference(track) && track.publication?.track != null;

  return (
    <div className="relative bg-slate-800 rounded-xl overflow-hidden">
      {hasVideo && isTrackReference(track) ? (
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-20 h-20 bg-purple-500/30 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-purple-300">
              {participant.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>
      )}

      {/* Overlay with participant info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">
              {isScreenShare
                ? `${participant.name}'s screen`
                : participant.name || participant.identity}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isScreenShare && (
              <div
                className={`p-1 rounded ${
                  isMicEnabled ? "bg-white/20" : "bg-red-500/50"
                }`}
              >
                {isMicEnabled ? (
                  <Mic className="w-3 h-3 text-white" />
                ) : (
                  <MicOff className="w-3 h-3 text-red-300" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}
