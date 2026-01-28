"use client";

import { useState, use, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track, RoomOptions, VideoPresets, RoomEvent } from "livekit-client";
import { Loader2, AlertCircle, Info, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import MeetingControls from "@/components/MeetingControls";
import ParticipantsList from "@/components/ParticipantsList";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import VideoGrid from "@/components/VideoGrid";
import PreJoinScreen from "@/components/PreJoinScreen";
import UserMenu from "@/components/UserMenu";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function MeetingPage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewMeeting = searchParams.get("new") === "true";
  const [meetingName, setMeetingName] = useState("");
  const [existingMeetingName, setExistingMeetingName] = useState("");
  const [hostIdentity, setHostIdentity] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [initialAudioEnabled, setInitialAudioEnabled] = useState(true);
  const [initialVideoEnabled, setInitialVideoEnabled] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [isHost, setIsHost] = useState(false);

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  // Fetch existing meeting info for participants joining
  useEffect(() => {
    if (!isNewMeeting) {
      fetch(`/api/meeting?code=${code}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid && data.meetingName) {
            setExistingMeetingName(data.meetingName);
          }
          if (data.hostIdentity) {
            setHostIdentity(data.hostIdentity);
          }
        })
        .catch(console.error);
    }
  }, [code, isNewMeeting]);

  const handleJoin = useCallback(async (name: string, audioEnabled: boolean, videoEnabled: boolean, meetingTitle?: string) => {
    setParticipantName(name);
    setInitialAudioEnabled(audioEnabled);
    setInitialVideoEnabled(videoEnabled);
    
    // For new meetings, the joiner is the host and sets the meeting name
    // For existing meetings, use the existing meeting name
    const isHostUser = isNewMeeting;
    setIsHost(isHostUser);
    
    if (isHostUser && meetingTitle) {
      setMeetingName(meetingTitle);
      setHostIdentity(name);
    } else if (existingMeetingName) {
      setMeetingName(existingMeetingName);
    }
    
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
          isHost: isHostUser,
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
  }, [code, isNewMeeting, existingMeetingName]);

  const handleDisconnect = () => {
    router.push("/");
  };

  // Room options to set initial audio/video state with 1080p capture
  // Starts with high bitrate (4 Mbps), dynamically adjusts based on participant count
  const roomOptions: RoomOptions = {
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
    },
    publishDefaults: {
      simulcast: true,
      videoEncoding: {
        maxBitrate: 4_000_000, // 4 Mbps - high bitrate for small meetings
        maxFramerate: 30,
      },
      videoSimulcastLayers: [
        VideoPresets.h180,
        VideoPresets.h360,
        VideoPresets.h720,
        VideoPresets.h1080,
      ],
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
        isNewMeeting={isNewMeeting}
        existingMeetingName={existingMeetingName}
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
      className="min-h-screen bg-[#121212]"
    >
      <MeetingRoomContent meetingCode={code} meetingName={meetingName} isHost={isHost} hostIdentity={hostIdentity} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Bitrate constants for dynamic quality adjustment
const STANDARD_BITRATE = 2_500_000; // 2.5 Mbps for 3+ participants
const HIGH_BITRATE = 4_000_000; // 4 Mbps for 1-2 participants

interface MeetingRoomContentProps {
  meetingCode: string;
  meetingName: string;
  isHost: boolean;
  hostIdentity: string;
}

function MeetingRoomContent({ meetingCode, meetingName: initialMeetingName, isHost, hostIdentity: initialHostIdentity }: MeetingRoomContentProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { accentColor } = useAccentColor();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  const [meetingName, setMeetingName] = useState(initialMeetingName);
  const [hostIdentity, setHostIdentity] = useState(initialHostIdentity);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialMeetingName);
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const meetingInfoRef = useRef<HTMLDivElement>(null);
  const lastBitrateRef = useRef<number | null>(null);
  const hasSetInitialMetadata = useRef(false);
  const hasSetRoomMetadata = useRef(false);
  const encoderRef = useRef(new TextEncoder());
  const decoderRef = useRef(new TextDecoder());

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Set participant metadata when joining
  useEffect(() => {
    if (hasSetInitialMetadata.current) return;
    if (room.state !== "connected") return;
    
    const setMetadata = async () => {
      if (hasSetInitialMetadata.current) return;
      
      try {
        // Set participant metadata (accent color and host status)
        const participantMetadata = { 
          accentColor,
          ...(isHost ? { isHost: true } : {})
        };
        await room.localParticipant.setMetadata(JSON.stringify(participantMetadata));
        hasSetInitialMetadata.current = true;
      } catch (error) {
        console.error("Failed to set participant metadata:", error);
      }
    };
    
    setMetadata();
  }, [room, room.state, room.localParticipant, accentColor, isHost]);

  // Host sets room metadata via server API with retry
  useEffect(() => {
    if (!isHost || hasSetRoomMetadata.current) return;
    if (room.state !== "connected") return;
    
    const setRoomMetadata = async (retryCount = 0) => {
      if (hasSetRoomMetadata.current) return;
      
      try {
        const response = await fetch("/api/meeting", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: meetingCode,
            meetingName: initialMeetingName,
            hostIdentity: room.localParticipant.identity,
          }),
        });
        
        if (response.ok) {
          hasSetRoomMetadata.current = true;
          console.log("Room metadata set:", { meetingName: initialMeetingName, hostIdentity: room.localParticipant.identity });
        } else if (retryCount < 3) {
          // Retry after a short delay if the room might not be ready yet
          console.log("Retrying room metadata set...", retryCount + 1);
          setTimeout(() => setRoomMetadata(retryCount + 1), 1000);
        }
      } catch (error) {
        console.error("Failed to set room metadata:", error);
        if (retryCount < 3) {
          setTimeout(() => setRoomMetadata(retryCount + 1), 1000);
        }
      }
    };
    
    // Small initial delay to ensure room is fully created
    const timeoutId = setTimeout(() => setRoomMetadata(), 500);
    return () => clearTimeout(timeoutId);
  }, [room, room.state, room.localParticipant, isHost, initialMeetingName, meetingCode]);

  // Listen for room metadata updates (for participants to get meeting info)
  useEffect(() => {
    if (room.state !== "connected") return;
    
    const handleMetadataChanged = () => {
      if (room.metadata) {
        try {
          const metadata = JSON.parse(room.metadata);
          if (metadata.meetingName && metadata.meetingName !== meetingName) {
            setMeetingName(metadata.meetingName);
            setTempName(metadata.meetingName);
          }
          if (metadata.hostIdentity && metadata.hostIdentity !== hostIdentity) {
            setHostIdentity(metadata.hostIdentity);
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    };
    
    // Check initial room metadata
    handleMetadataChanged();
    
    // Listen for updates
    room.on("roomMetadataChanged", handleMetadataChanged);
    return () => {
      room.off("roomMetadataChanged", handleMetadataChanged);
    };
  }, [room, room.state, room.metadata, meetingName, hostIdentity]);

  // Dynamic bitrate adjustment based on participant count
  // 1-2 participants: high bitrate (4 Mbps) for better quality
  // 3+ participants: standard bitrate (2.5 Mbps) to manage bandwidth
  useEffect(() => {
    const participantCount = participants.length;
    const targetBitrate = participantCount <= 2 ? HIGH_BITRATE : STANDARD_BITRATE;

    // Only update if bitrate needs to change
    if (lastBitrateRef.current === targetBitrate) return;

    const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (!cameraPublication?.track) return;

    const sender = cameraPublication.track.sender;
    if (!sender) return;

    const params = sender.getParameters();
    if (params.encodings && params.encodings.length > 0) {
      // Update max bitrate for all encoding layers
      params.encodings.forEach((encoding) => {
        encoding.maxBitrate = targetBitrate;
      });

      sender.setParameters(params).then(() => {
        lastBitrateRef.current = targetBitrate;
        console.log(`Video bitrate adjusted to ${targetBitrate / 1_000_000} Mbps for ${participantCount} participant(s)`);
      }).catch((err) => {
        console.error("Failed to adjust video bitrate:", err);
      });
    }
  }, [participants.length, room.localParticipant]);

  // Meeting timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chat message handling - always active regardless of panel visibility
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant: { identity: string; name?: string } | undefined) => {
      try {
        const data = JSON.parse(decoderRef.current.decode(payload));
        if (data.type === "chat") {
          const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            sender: participant?.name || participant?.identity || "Unknown",
            senderIdentity: participant?.identity || "unknown",
            message: data.message,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, newMessage]);
        }
      } catch (e) {
        console.error("Error parsing chat message:", e);
      }
    },
    []
  );

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, handleDataReceived]);

  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const data = JSON.stringify({
      type: "chat",
      message: message.trim(),
    });

    // Add message locally
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: localParticipant.name || localParticipant.identity,
      senderIdentity: localParticipant.identity,
      message: message.trim(),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);

    // Send to all participants
    await localParticipant.publishData(encoderRef.current.encode(data), {
      reliable: true,
    });
  }, [localParticipant]);

  // Click outside handler for meeting info popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (meetingInfoRef.current && !meetingInfoRef.current.contains(event.target as Node)) {
        setShowMeetingInfo(false);
        setEditingName(false);
        setTempName(meetingName);
      }
    };

    if (showMeetingInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMeetingInfo, meetingName]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSaveName = async () => {
    setMeetingName(tempName);
    setEditingName(false);
    
    // Update room metadata via server API if host
    if (isHost && room.state === "connected") {
      try {
        await fetch("/api/meeting", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: meetingCode,
            meetingName: tempName,
            hostIdentity: hostIdentity,
          }),
        });
      } catch (error) {
        console.error("Failed to update room metadata:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setTempName(meetingName);
    setEditingName(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#121212]">
      {/* Header */}
      <header className="relative z-20 h-16 flex items-center justify-between px-6">
        {/* Timer - Left */}
        <div className="flex items-center">
          <span className="text-white text-sm font-regular opacity-30 hover:opacity-100 transition-opacity">{formatTime(elapsedTime)}</span>
        </div>

        {/* Meeting Name - Center */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="relative" ref={meetingInfoRef}>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-regular text-sm opacity-30">
                {meetingName || "Meeting"}
              </h2>
              <button
                onClick={() => setShowMeetingInfo(!showMeetingInfo)}
                className="text-white/30 hover:text-white transition-opacity"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Meeting Info Popup */}
            <AnimatePresence>
              {showMeetingInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  style={{ transformOrigin: "top center" }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-[#2a2a2a] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                >
                  {/* Meeting Name Section */}
                  <div className="p-4 border-b border-white/10">
                    <label className="text-white/50 text-xs font-medium mb-2 block">
                      Meeting name
                    </label>
                    {isHost && editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="Enter meeting name"
                          className="flex-1 bg-[#1a1a1a] text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-white/30 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={handleSaveName}
                          className="p-2 text-green-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isHost ? (
                      <button
                        onClick={() => {
                          setTempName(meetingName);
                          setEditingName(true);
                        }}
                        className="w-full text-left text-white text-sm px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
                      >
                        {meetingName || "Add meeting name..."}
                      </button>
                    ) : (
                      <div className="w-full text-left text-white/70 text-sm px-3 py-2 rounded-lg bg-[#1a1a1a]">
                        {meetingName || "No name set"}
                      </div>
                    )}
                  </div>

                  {/* Meeting Code Section */}
                  <div className="p-4">
                    <label className="text-white/50 text-xs font-medium mb-2 block">
                      Meeting code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1a1a1a] text-white/70 text-sm px-3 py-2 rounded-lg font-mono">
                        {meetingCode}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy meeting code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Profile Button - Right */}
        <UserMenu />
      </header>

      {/* Main Content */}
      <motion.div className="flex-1 flex overflow-hidden relative px-4">
        {/* Video Grid Area */}
        <div className={`flex-1 h-full min-w-0 ${(showChat || showParticipants) ? 'hidden md:block' : ''}`}>
          <VideoGrid tracks={tracks} />
        </div>

        {/* Side Panels - Full screen overlay on mobile, sidebar on desktop */}
        <AnimatePresence>
          {(showChat || showParticipants) && (
            <motion.div
              initial={{ width: 0, marginLeft: 0 }}
              animate={{ width: 320, marginLeft: 16 }}
              exit={{ width: 0, marginLeft: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1]
              }}
              className="absolute inset-0 md:relative md:inset-auto md:h-full bg-[#1a1a1a] flex flex-col z-10 overflow-hidden md:rounded-xl"
            >
              {/* Panel Content */}
              <div className="flex-1 overflow-hidden min-w-80">
                {showParticipants && <ParticipantsList hostIdentity={hostIdentity} />}
                {showChat && <ChatPanel messages={chatMessages} onSendMessage={handleSendChatMessage} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
