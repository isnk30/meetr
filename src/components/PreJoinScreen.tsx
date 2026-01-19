"use client";

import { useEffect, useRef, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
  ArrowLeft,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type PermissionStatus = "pending" | "granted" | "denied" | "error";

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface PreJoinScreenProps {
  meetingCode: string;
  onJoin: (name: string, audioEnabled: boolean, videoEnabled: boolean) => void;
  onBack: () => void;
}

export default function PreJoinScreen({
  meetingCode,
  onJoin,
  onBack,
}: PreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);
  const micDropdownRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("pending");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Device selection state
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);

  useEffect(() => {
    requestPermissions();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Attach stream to video element when permissions are granted
  useEffect(() => {
    if (permissionStatus === "granted" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [permissionStatus]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cameraDropdownRef.current && !cameraDropdownRef.current.contains(event.target as Node)) {
        setCameraDropdownOpen(false);
      }
      if (micDropdownRef.current && !micDropdownRef.current.contains(event.target as Node)) {
        setMicDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      // Set default selected devices from current stream
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const audioTrack = streamRef.current.getAudioTracks()[0];
        
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          setSelectedVideoDevice(settings.deviceId || videoInputs[0]?.deviceId || "");
        }
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          setSelectedAudioDevice(settings.deviceId || audioInputs[0]?.deviceId || "");
        }
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  const switchDevice = async (type: "video" | "audio", deviceId: string) => {
    if (!streamRef.current) return;

    try {
      if (type === "video") {
        // Stop current video track
        const currentVideoTrack = streamRef.current.getVideoTracks()[0];
        if (currentVideoTrack) {
          currentVideoTrack.stop();
          streamRef.current.removeTrack(currentVideoTrack);
        }

        // Get new video track
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        newVideoTrack.enabled = videoEnabled;
        streamRef.current.addTrack(newVideoTrack);
        setSelectedVideoDevice(deviceId);

        // Update video element
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } else {
        // Stop current audio track
        const currentAudioTrack = streamRef.current.getAudioTracks()[0];
        if (currentAudioTrack) {
          currentAudioTrack.stop();
          streamRef.current.removeTrack(currentAudioTrack);
        }

        // Get new audio track
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        newAudioTrack.enabled = audioEnabled;
        streamRef.current.addTrack(newAudioTrack);
        setSelectedAudioDevice(deviceId);
      }
    } catch (error) {
      console.error(`Error switching ${type} device:`, error);
    }
  };

  const requestPermissions = async () => {
    setPermissionStatus("pending");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setPermissionStatus("granted");

      // Attach video stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate available devices
      await enumerateDevices();
    } catch (error) {
      console.error("Permission error:", error);

      if (error instanceof DOMException) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setPermissionStatus("denied");
          setErrorMessage(
            "Camera and microphone access was denied. Please allow access in your browser settings to join the meeting."
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setPermissionStatus("error");
          setErrorMessage(
            "No camera or microphone found. Please connect a device and try again."
          );
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          setPermissionStatus("error");
          setErrorMessage(
            "Your camera or microphone is already in use by another application."
          );
        } else {
          setPermissionStatus("error");
          setErrorMessage(
            "Unable to access camera and microphone. Please check your device settings."
          );
        }
      } else {
        setPermissionStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleJoin = () => {
    if (!name.trim()) return;
    // Stop the preview stream before joining
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onJoin(name.trim(), audioEnabled, videoEnabled);
  };

  // Format meeting code with dashes for display
  const formatMeetingCode = (code: string) => {
    if (code.length === 10) {
      return `${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7)}`;
    }
    return code;
  };

  const isJoinEnabled = name.trim().length > 0;

  const getSelectedVideoLabel = () => {
    const device = videoDevices.find((d) => d.deviceId === selectedVideoDevice);
    return device?.label || "Select camera";
  };

  const getSelectedAudioLabel = () => {
    const device = audioDevices.find((d) => d.deviceId === selectedAudioDevice);
    return device?.label || "Select microphone";
  };

  if (permissionStatus === "pending") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Requesting Access
          </h2>
          <p className="text-white/30">
            Please allow access to your camera and microphone to join the
            meeting.
          </p>
        </div>
      </div>
    );
  }

  if (permissionStatus === "denied" || permissionStatus === "error") {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {permissionStatus === "denied"
              ? "Permission Denied"
              : "Device Error"}
          </h2>
          <p className="text-white/30 mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={requestPermissions}
              className="px-6 py-3 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-all"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        className="absolute top-5 left-7 p-3 rounded-lg hover:bg-white/5 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </motion.button>

      {/* Meeting Code */}
      <div className="flex items-center gap-1 mb-6">
        <span className="text-white/30 text-base">meeting code:</span>
        <span className="text-white text-base">{formatMeetingCode(meetingCode)}</span>
      </div>

      {/* Video Preview */}
      <div className="relative w-[580px] h-[325px] bg-[#535353] rounded-xl overflow-hidden mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${videoEnabled ? "" : "hidden"}`}
        />
        {!videoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-[#3a3a3a] rounded-full flex items-center justify-center">
              <span className="text-3xl font-semibold text-white">
                {name.trim() ? name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute top-4 right-4 flex gap-2">
          {!audioEnabled && (
            <div className="p-2 bg-red-500/20 rounded-lg">
              <MicOff className="w-4 h-4 text-red-400" />
            </div>
          )}
          {!videoEnabled && (
            <div className="p-2 bg-red-500/20 rounded-lg">
              <VideoOff className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>
      </div>

      {/* Device Selectors */}
      <div className="flex items-center gap-9 mb-6">
        {/* Camera Selector */}
        <div className="relative flex items-center gap-1" ref={cameraDropdownRef}>
          <motion.button
            onClick={toggleVideo}
            className="p-3 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {videoEnabled ? (
              <Video className="w-5 h-5 text-white opacity-30" />
            ) : (
              <VideoOff className="w-5 h-5 text-white opacity-30" />
            )}
          </motion.button>
          <motion.button
            onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
            className="flex items-center gap-0.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white/30 text-base max-w-[140px] truncate">
              {getSelectedVideoLabel()}
            </span>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${cameraDropdownOpen ? "rotate-180" : ""}`} />
          </motion.button>

          <AnimatePresence>
            {cameraDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                style={{ transformOrigin: "top left" }}
                className="absolute left-0 top-full mt-2 p-1 bg-[#1E1E1E] border border-[#252525] rounded-xl shadow-[0px_7px_16px_rgba(0,0,0,0.14)] z-50"
              >
                <div className="flex flex-col gap-0.5">
                  {videoDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => {
                        switchDevice("video", device.deviceId);
                        setCameraDropdownOpen(false);
                      }}
                      className="flex items-center justify-between gap-3 px-2 py-1.5 min-w-[200px] rounded-lg hover:bg-[#2B2B2B] transition-colors"
                    >
                      <span className="text-white/30 text-xs truncate">{device.label}</span>
                      {device.deviceId === selectedVideoDevice && (
                        <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mic Selector */}
        <div className="relative flex items-center gap-1" ref={micDropdownRef}>
          <motion.button
            onClick={toggleAudio}
            className="p-3 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {audioEnabled ? (
              <Mic className="w-5 h-5 text-white opacity-30" />
            ) : (
              <MicOff className="w-5 h-5 text-white opacity-30" />
            )}
          </motion.button>
          <motion.button
            onClick={() => setMicDropdownOpen(!micDropdownOpen)}
            className="flex items-center gap-0.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white/30 text-base max-w-[140px] truncate">
              {getSelectedAudioLabel()}
            </span>
            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${micDropdownOpen ? "rotate-180" : ""}`} />
          </motion.button>

          <AnimatePresence>
            {micDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                style={{ transformOrigin: "top left" }}
                className="absolute left-0 top-full mt-2 p-1 bg-[#1E1E1E] border border-[#252525] rounded-xl shadow-[0px_7px_16px_rgba(0,0,0,0.14)] z-50"
              >
                <div className="flex flex-col gap-0.5">
                  {audioDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => {
                        switchDevice("audio", device.deviceId);
                        setMicDropdownOpen(false);
                      }}
                      className="flex items-center justify-between gap-3 px-2 py-1.5 min-w-[200px] rounded-lg hover:bg-[#2B2B2B] transition-colors"
                    >
                      <span className="text-white/30 text-xs truncate">{device.label}</span>
                      {device.deviceId === selectedAudioDevice && (
                        <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Name Input and Join Button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="enter your name"
          className="w-52 h-11 px-3 bg-[#232323] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          autoFocus
        />
        <motion.button
          onClick={handleJoin}
          disabled={!isJoinEnabled}
          className={`h-11 px-6 flex items-center justify-center gap-1 rounded-lg transition-colors font-semibold text-base ${
            isJoinEnabled
              ? "bg-white hover:bg-white/90 text-black"
              : "bg-[#232323] border border-white/5"
          }`}
          whileTap={isJoinEnabled ? { scale: 0.97 } : undefined}
          initial={{ gap: 4 }}
          whileHover={isJoinEnabled ? { gap: 8 } : { gap: 4 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className={isJoinEnabled ? "text-black" : "text-[#5D5D5D]"}>Join</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key="arrow"
              className="flex items-center justify-center"
              variants={{
                initial: { x: 0 },
                hover: { x: 2 },
              }}
              transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            >
              <ArrowRight
                className={`w-5 h-5 ${isJoinEnabled ? "text-black" : "text-[#5D5D5D]"}`}
                strokeWidth={2.5}
              />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
