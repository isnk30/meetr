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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type PermissionStatus = "pending" | "granted" | "denied" | "error";

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

  const [name, setName] = useState("");
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("pending");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    requestPermissions();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

      {/* Meeting Code */}
      <div className="flex items-center gap-1 mb-6">
        <span className="text-white/30 text-base">meeting code:</span>
        <span className="text-white text-base">{formatMeetingCode(meetingCode)}</span>
      </div>

      {/* Device Selectors */}
      <div className="flex items-center gap-9 mb-6">
        {/* Camera Selector */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={toggleVideo}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
            style={{ opacity: 0.3 }}
            whileTap={{ scale: 0.95 }}
          >
            {videoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </motion.button>
          <div className="flex items-center gap-0.5 opacity-30">
            <span className="text-white text-base">System default</span>
            <ChevronDown className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Mic Selector */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={toggleAudio}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
            style={{ opacity: 0.3 }}
            whileTap={{ scale: 0.95 }}
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </motion.button>
          <div className="flex items-center gap-0.5 opacity-30">
            <span className="text-white text-base">System default</span>
            <ChevronDown className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Name Input and Join Button */}
      <div className="flex items-center gap-3">
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
