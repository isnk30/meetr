"use client";

import { useState, useRef, useCallback } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  X,
} from "lucide-react";

interface MeetingControlsProps {
  showChat: boolean;
  showParticipants: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
}

export default function MeetingControls({
  showChat,
  showParticipants,
  onToggleChat,
  onToggleParticipants,
}: MeetingControlsProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  
  // Track which tooltip is visible and if we're in "instant" mode
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isInstant, setIsInstant] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const instantTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMicEnabled = localParticipant.isMicrophoneEnabled;
  const isCameraEnabled = localParticipant.isCameraEnabled;

  const handleMouseEnter = useCallback((id: string) => {
    // Clear any pending hide timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // If we're in instant mode (a tooltip was recently shown), show immediately
    if (isInstant) {
      setActiveTooltip(id);
    } else {
      // First tooltip - apply delay
      timeoutRef.current = setTimeout(() => {
        setActiveTooltip(id);
        setIsInstant(true);
      }, 500);
    }
    
    // Reset the instant mode timeout
    if (instantTimeoutRef.current) {
      clearTimeout(instantTimeoutRef.current);
    }
  }, [isInstant]);

  const handleMouseLeave = useCallback(() => {
    // Clear pending show timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Hide tooltip immediately
    setActiveTooltip(null);
    
    // Keep instant mode for a short period after leaving
    if (instantTimeoutRef.current) {
      clearTimeout(instantTimeoutRef.current);
    }
    instantTimeoutRef.current = setTimeout(() => {
      setIsInstant(false);
    }, 300);
  }, []);

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const leaveRoom = () => {
    room.disconnect();
  };

  return (
    <div className="h-20 flex items-center justify-between px-6">
      {/* Left: Mute and Video buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMicrophone}
          onMouseEnter={() => handleMouseEnter("mic")}
          onMouseLeave={handleMouseLeave}
          className="group relative p-3 rounded-lg hover:bg-white/5 transition-colors active:scale-95"
        >
          {isMicEnabled ? (
            <Mic className="w-5 h-5 text-white opacity-30" strokeWidth={2.5} />
          ) : (
            <MicOff className="w-5 h-5 text-white opacity-30" strokeWidth={2.5} />
          )}
          <span 
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity ${
              activeTooltip === "mic" ? "opacity-100" : "opacity-0"
            }`}
          >
            {isMicEnabled ? "Mute" : "Unmute"}
          </span>
        </button>

        <button
          onClick={toggleCamera}
          onMouseEnter={() => handleMouseEnter("camera")}
          onMouseLeave={handleMouseLeave}
          className="group relative p-3 rounded-lg hover:bg-white/5 transition-colors active:scale-95"
        >
          {isCameraEnabled ? (
            <Video className="w-5 h-5 text-white opacity-30" strokeWidth={2.5} />
          ) : (
            <VideoOff className="w-5 h-5 text-white opacity-30" strokeWidth={2.5} />
          )}
          <span 
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity ${
              activeTooltip === "camera" ? "opacity-100" : "opacity-0"
            }`}
          >
            {isCameraEnabled ? "Stop Video" : "Start Video"}
          </span>
        </button>
      </div>

      {/* Center: Leave button */}
      <button
        onClick={leaveRoom}
        className="flex items-center gap-2 px-6 py-3 bg-[#FF3A3A]/30 opacity-50 hover:opacity-100 text-[#FF3A3A] rounded-lg transition-all active:scale-95"
      >
        <span className="font-medium">Leave</span>
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Right: Participants and Chat buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleParticipants}
          onMouseEnter={() => handleMouseEnter("participants")}
          onMouseLeave={handleMouseLeave}
          className={`group relative p-3 rounded-lg hover:bg-white/5 transition-colors active:scale-95 ${
            showParticipants ? "bg-white/5" : ""
          }`}
        >
          <Users className={`w-5 h-5 text-white ${showParticipants ? "opacity-60" : "opacity-30"}`} strokeWidth={2.5} />
          <span 
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity ${
              activeTooltip === "participants" ? "opacity-100" : "opacity-0"
            }`}
          >
            Participants
          </span>
        </button>

        <button
          onClick={onToggleChat}
          onMouseEnter={() => handleMouseEnter("chat")}
          onMouseLeave={handleMouseLeave}
          className={`group relative p-3 rounded-lg hover:bg-white/5 transition-colors active:scale-95 ${
            showChat ? "bg-white/5" : ""
          }`}
        >
          <MessageSquare className={`w-5 h-5 text-white ${showChat ? "opacity-60" : "opacity-30"}`} strokeWidth={2.5} />
          <span 
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity ${
              activeTooltip === "chat" ? "opacity-100" : "opacity-0"
            }`}
          >
            Chat
          </span>
        </button>
      </div>
    </div>
  );
}
