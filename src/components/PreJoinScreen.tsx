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
} from "lucide-react";

type PermissionStatus = "pending" | "granted" | "denied" | "error";

interface PreJoinScreenProps {
  meetingCode: string;
  participantName: string;
  onJoin: (audioEnabled: boolean, videoEnabled: boolean) => void;
}

export default function PreJoinScreen({
  meetingCode,
  participantName,
  onJoin,
}: PreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    // Stop the preview stream before joining
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onJoin(audioEnabled, videoEnabled);
  };

  if (permissionStatus === "pending") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Requesting Access
          </h2>
          <p className="text-gray-400">
            Please allow access to your camera and microphone to join the
            meeting.
          </p>
        </div>
      </div>
    );
  }

  if (permissionStatus === "denied" || permissionStatus === "error") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {permissionStatus === "denied"
              ? "Permission Denied"
              : "Device Error"}
          </h2>
          <p className="text-gray-400 mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={requestPermissions}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Ready to join?
          </h1>
          <p className="text-gray-400">
            Meeting code: <span className="font-mono text-purple-400">{meetingCode}</span>
          </p>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-6 border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              videoEnabled ? "" : "hidden"
            }`}
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-3xl font-semibold text-white">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Name Badge */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg">
            <span className="text-white text-sm font-medium">
              {participantName}
            </span>
          </div>

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

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
              audioEnabled
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
            }`}
          >
            {audioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
            <span className="font-medium">
              {audioEnabled ? "Mute" : "Unmute"}
            </span>
          </button>

          <button
            onClick={toggleVideo}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
              videoEnabled
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
            }`}
          >
            {videoEnabled ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
            <span className="font-medium">
              {videoEnabled ? "Stop Video" : "Start Video"}
            </span>
          </button>
        </div>

        {/* Join Button */}
        <div className="flex justify-center">
          <button
            onClick={handleJoin}
            className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
          >
            Join Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
