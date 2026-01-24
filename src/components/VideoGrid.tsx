"use client";

import {
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  useParticipants,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import { MicOff, VideoOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VideoGridProps {
  tracks: TrackReferenceOrPlaceholder[];
}

export default function VideoGrid({ tracks }: VideoGridProps) {
  // Get all participants to access their latest metadata
  const participants = useParticipants();
  
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
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-4";
  };

  // Create a map for quick participant lookup by identity
  const participantMap = new Map<string, Participant>();
  participants.forEach((p) => participantMap.set(p.identity, p));

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
      {videoTracks.map((track) => {
        // Get the latest participant data with updated metadata
        const latestParticipant = participantMap.get(track.participant.identity) || track.participant;
        return (
          <ParticipantTile
            key={track.participant.identity + track.source}
            track={track}
            participant={latestParticipant}
          />
        );
      })}
    </div>
  );
}

interface ParticipantTileProps {
  track: TrackReferenceOrPlaceholder;
  participant: Participant;
}

// Default accent color when participant hasn't set one
const DEFAULT_ACCENT_COLOR = "#3B82F6"; // blue

function ParticipantTile({ track, participant }: ParticipantTileProps) {
  const isScreenShare = track.source === Track.Source.ScreenShare;
  const isMicEnabled = participant.isMicrophoneEnabled;
  const isCameraEnabled = participant.isCameraEnabled;
  const hasVideoTrack = isTrackReference(track) && track.publication?.track != null;
  
  // For camera tracks, check if camera is enabled (track might exist but be disabled)
  // For screen shares, just check if track exists
  const showVideo = isScreenShare ? hasVideoTrack : (hasVideoTrack && isCameraEnabled);

  // Get accent color from participant's metadata (each user has their own color)
  let participantAccentColor = DEFAULT_ACCENT_COLOR;
  try {
    if (participant.metadata) {
      const metadata = JSON.parse(participant.metadata);
      console.log("Participant metadata:", participant.identity, metadata);
      if (metadata.accentColor) {
        participantAccentColor = metadata.accentColor;
      }
    }
  } catch {
    // Invalid metadata, use default
  }

  // Use participant's accent color when video is off, gray when video is on
  const bgColor = showVideo ? "#535353" : participantAccentColor;
  const participantName = participant.name || participant.identity;

  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {showVideo && isTrackReference(track) ? (
        <VideoTrack 
          trackRef={track} 
          className={`w-full h-full object-cover ${!isScreenShare ? "scale-x-[-1]" : ""}`} 
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-medium text-white">
            {isScreenShare ? `${participantName}'s screen` : participantName}
          </span>
        </div>
      )}

      {/* Status Indicators - Bottom Overlay */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-[2px]"
        layout
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <AnimatePresence mode="popLayout">
          {/* Name Badge (only when camera is on or screen share) */}
          {showVideo && (
            <motion.div
              key="name-badge"
              layout
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center justify-center px-2.5 h-8 rounded-xl border border-white/[0.05]"
              style={{ 
                backgroundColor: "rgba(30, 30, 30, 0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}
            >
              <span className="text-[15px] text-white/90 font-normal">
                {isScreenShare
                  ? `${participantName}'s screen`
                  : participantName}
              </span>
            </motion.div>
          )}

          {/* Camera Status (only when camera is off and not screen share) */}
          {!isScreenShare && !isCameraEnabled && (
            <motion.div
              key="video-off"
              layout
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.05]"
              style={{ 
                backgroundColor: "rgba(30, 30, 30, 0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}
            >
              <VideoOff className="w-[14px] h-[14px] text-white/90" />
            </motion.div>
          )}

          {/* Mic Status */}
          {!isScreenShare && !isMicEnabled && (
            <motion.div
              key="mic-off"
              layout
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.05]"
              style={{ 
                backgroundColor: "rgba(30, 30, 30, 0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)"
              }}
            >
              <MicOff className="w-[14px] h-[14px] text-white/90" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Speaking Indicator - uses participant's accent color */}
      {participant.isSpeaking && (
        <div 
          className="absolute inset-0 border-2 rounded-xl pointer-events-none" 
          style={{ borderColor: participantAccentColor }}
        />
      )}
    </div>
  );
}
