"use client";

import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  MessageSquare,
  Monitor,
  MonitorOff,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMicEnabled = localParticipant.isMicrophoneEnabled;
  const isCameraEnabled = localParticipant.isCameraEnabled;

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    } else {
      await localParticipant.setScreenShareEnabled(true);
      setIsScreenSharing(true);
    }
  };

  const leaveRoom = () => {
    room.disconnect();
  };

  const copyMeetingLink = async () => {
    const link = window.location.href;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-20 bg-slate-800/80 border-t border-white/10 flex items-center justify-center px-6">
      <div className="flex items-center gap-3">
        {/* Microphone */}
        <ControlButton
          onClick={toggleMicrophone}
          active={isMicEnabled}
          icon={isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          label={isMicEnabled ? "Mute" : "Unmute"}
          danger={!isMicEnabled}
        />

        {/* Camera */}
        <ControlButton
          onClick={toggleCamera}
          active={isCameraEnabled}
          icon={isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          label={isCameraEnabled ? "Stop Video" : "Start Video"}
          danger={!isCameraEnabled}
        />

        {/* Screen Share */}
        <ControlButton
          onClick={toggleScreenShare}
          active={isScreenSharing}
          icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          activeColor="green"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-white/10 mx-2" />

        {/* Participants */}
        <ControlButton
          onClick={onToggleParticipants}
          active={showParticipants}
          icon={<Users className="w-5 h-5" />}
          label="Participants"
          activeColor="purple"
        />

        {/* Chat */}
        <ControlButton
          onClick={onToggleChat}
          active={showChat}
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chat"
          activeColor="purple"
        />

        {/* Copy Link */}
        <ControlButton
          onClick={copyMeetingLink}
          active={copied}
          icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          label={copied ? "Copied!" : "Copy Link"}
          activeColor="green"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-white/10 mx-2" />

        {/* Leave */}
        <button
          onClick={leaveRoom}
          className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="font-medium">Leave</span>
        </button>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  activeColor?: "purple" | "green";
}

function ControlButton({
  onClick,
  active,
  icon,
  label,
  danger,
  activeColor,
}: ControlButtonProps) {
  let bgColor = "bg-white/10 hover:bg-white/20";
  
  if (danger) {
    bgColor = "bg-red-500/20 hover:bg-red-500/30 text-red-400";
  } else if (active && activeColor === "purple") {
    bgColor = "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400";
  } else if (active && activeColor === "green") {
    bgColor = "bg-green-500/20 hover:bg-green-500/30 text-green-400";
  }

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center w-12 h-12 ${bgColor} text-white rounded-xl transition-all`}
      title={label}
    >
      {icon}
      <span className="absolute bottom-full mb-2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}
