"use client";

import { useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Track, RoomOptions, VideoPresets } from "livekit-client";
import { Loader2, AlertCircle } from "lucide-react";

import MeetingControls from "@/components/MeetingControls";
import ParticipantsList from "@/components/ParticipantsList";
import ChatPanel from "@/components/ChatPanel";
import VideoGrid from "@/components/VideoGrid";
import PreJoinScreen from "@/components/PreJoinScreen";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function MeetingPage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [initialAudioEnabled, setInitialAudioEnabled] = useState(true);
  const [initialVideoEnabled, setInitialVideoEnabled] = useState(true);
  const [participantName, setParticipantName] = useState("");

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleJoin = useCallback(async (name: string, audioEnabled: boolean, videoEnabled: boolean) => {
    setParticipantName(name);
    setInitialAudioEnabled(audioEnabled);
    setInitialVideoEnabled(videoEnabled);
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: code,
          participantName: name,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsConnecting(false);
        return;
      }

      setToken(data.token);
      setWsUrl(data.wsUrl);
      setIsConnecting(false);
      setHasJoined(true);
    } catch {
      setError("Failed to connect to the meeting. Please try again.");
      setIsConnecting(false);
    }
  }, [code]);

  const handleDisconnect = () => {
    router.push("/");
  };

  // Room options to set initial audio/video state
  const roomOptions: RoomOptions = {
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
    publishDefaults: {
      simulcast: true,
    },
  };

  // Show pre-join screen before connecting to the room
  if (!hasJoined) {
    if (isConnecting) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to meeting...</p>
            <p className="text-white/30 text-sm mt-2">Meeting code: {code}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Error
            </h2>
            <p className="text-white/30 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <PreJoinScreen
        meetingCode={code}
        onJoin={handleJoin}
        onBack={handleBack}
      />
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-white text-lg">Missing connection details</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      options={roomOptions}
      video={initialVideoEnabled}
      audio={initialAudioEnabled}
      onDisconnected={handleDisconnect}
      data-lk-theme="default"
      className="min-h-screen bg-slate-900"
    >
      <MeetingRoomContent meetingCode={code} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function MeetingRoomContent({ meetingCode }: { meetingCode: string }) {
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 bg-slate-800/50 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold">Meetr</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300 text-sm font-mono">{meetingCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {room.numParticipants} participant
            {room.numParticipants !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid Area */}
        <div className="flex-1 p-4">
          <VideoGrid tracks={tracks} />
        </div>

        {/* Side Panels */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-slate-800/50 border-l border-white/10 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => {
                  setShowParticipants(true);
                  setShowChat(false);
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  showParticipants
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Participants
              </button>
              <button
                onClick={() => {
                  setShowChat(true);
                  setShowParticipants(false);
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  showChat
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Chat
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {showParticipants && <ParticipantsList />}
              {showChat && <ChatPanel />}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <MeetingControls
        showChat={showChat}
        showParticipants={showParticipants}
        onToggleChat={() => {
          setShowChat(!showChat);
          if (!showChat) setShowParticipants(false);
        }}
        onToggleParticipants={() => {
          setShowParticipants(!showParticipants);
          if (!showParticipants) setShowChat(false);
        }}
      />
    </div>
  );
}
