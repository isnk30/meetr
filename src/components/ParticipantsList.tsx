"use client";

import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";

export default function ParticipantsList() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        {participants.map((participant) => {
          const isLocal = participant.identity === localParticipant.identity;
          const isMicEnabled = participant.isMicrophoneEnabled;
          const isCameraEnabled = participant.isCameraEnabled;

          return (
            <div
              key={participant.identity}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-300 font-medium text-sm">
                    {participant.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                {participant.isSpeaking && (
                  <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">
                    {participant.name || participant.identity}
                  </span>
                  {isLocal && (
                    <span className="text-xs text-gray-400">(You)</span>
                  )}
                </div>
                {participant.metadata && (
                  <div className="flex items-center gap-1 text-xs text-purple-400">
                    <Crown className="w-3 h-3" />
                    <span>Host</span>
                  </div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isMicEnabled
                      ? "bg-white/10 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isMicEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-1.5 rounded-lg ${
                    isCameraEnabled
                      ? "bg-white/10 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isCameraEnabled ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {participants.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p>No participants yet</p>
        </div>
      )}
    </div>
  );
}
