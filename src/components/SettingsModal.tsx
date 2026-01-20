"use client";

import { useState, useEffect, useRef } from "react";
import { X, Video, Mic, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMaybeRoomContext } from "@livekit/components-react";
import type { Room } from "livekit-client";

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // useMaybeRoomContext returns undefined if not inside a LiveKit room provider
  const room: Room | undefined = useMaybeRoomContext();
  const modalRef = useRef<HTMLDivElement>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);
  const micDropdownRef = useRef<HTMLDivElement>(null);

  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);

  // Enumerate devices on mount
  useEffect(() => {
    if (isOpen) {
      enumerateDevices();
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

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

      // Get current active devices from the room (if in a room context)
      if (room) {
        const localParticipant = room.localParticipant;
        
        // Get current video device
        const videoTrack = localParticipant.getTrackPublication("camera")?.track;
        if (videoTrack) {
          const settings = videoTrack.mediaStreamTrack?.getSettings();
          setSelectedVideoDevice(settings?.deviceId || videoInputs[0]?.deviceId || "");
        } else {
          setSelectedVideoDevice(videoInputs[0]?.deviceId || "");
        }

        // Get current audio device
        const audioTrack = localParticipant.getTrackPublication("microphone")?.track;
        if (audioTrack) {
          const settings = audioTrack.mediaStreamTrack?.getSettings();
          setSelectedAudioDevice(settings?.deviceId || audioInputs[0]?.deviceId || "");
        } else {
          setSelectedAudioDevice(audioInputs[0]?.deviceId || "");
        }
      } else {
        // Not in a room - just select the first available devices
        setSelectedVideoDevice(videoInputs[0]?.deviceId || "");
        setSelectedAudioDevice(audioInputs[0]?.deviceId || "");
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  const switchDevice = async (type: "video" | "audio", deviceId: string) => {
    try {
      if (room) {
        // In a room context - switch the active device
        const localParticipant = room.localParticipant;

        if (type === "video") {
          await localParticipant.setCameraEnabled(true);
          await room.switchActiveDevice("videoinput", deviceId);
          setSelectedVideoDevice(deviceId);
        } else {
          await localParticipant.setMicrophoneEnabled(true);
          await room.switchActiveDevice("audioinput", deviceId);
          setSelectedAudioDevice(deviceId);
        }
      } else {
        // Not in a room - just update the selection (preferences only)
        if (type === "video") {
          setSelectedVideoDevice(deviceId);
        } else {
          setSelectedAudioDevice(deviceId);
        }
      }
    } catch (error) {
      console.error(`Error switching ${type} device:`, error);
    }
  };

  const getSelectedVideoLabel = () => {
    const device = videoDevices.find((d) => d.deviceId === selectedVideoDevice);
    return device?.label || "Select camera";
  };

  const getSelectedAudioLabel = () => {
    const device = audioDevices.find((d) => d.deviceId === selectedAudioDevice);
    return device?.label || "Select microphone";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1E1E1E] border border-[#252525] rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-medium">Settings</h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-white/50" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Camera Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 text-sm font-medium">Camera</span>
                </div>
                <div className="relative" ref={cameraDropdownRef}>
                  <motion.button
                    onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#2B2B2B] rounded-xl hover:bg-[#333] transition-colors"
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="text-white/70 text-sm truncate pr-2">
                      {getSelectedVideoLabel()}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${
                        cameraDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {cameraDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 p-1 bg-[#2B2B2B] border border-[#3a3a3a] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {videoDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            onClick={() => {
                              switchDevice("video", device.deviceId);
                              setCameraDropdownOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                          >
                            <span className="text-white/70 text-sm truncate pr-2">
                              {device.label}
                            </span>
                            {device.deviceId === selectedVideoDevice && (
                              <Check className="w-4 h-4 text-white/50 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Microphone Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 text-sm font-medium">Microphone</span>
                </div>
                <div className="relative" ref={micDropdownRef}>
                  <motion.button
                    onClick={() => setMicDropdownOpen(!micDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#2B2B2B] rounded-xl hover:bg-[#333] transition-colors"
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="text-white/70 text-sm truncate pr-2">
                      {getSelectedAudioLabel()}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${
                        micDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {micDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 p-1 bg-[#2B2B2B] border border-[#3a3a3a] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
                      >
                        {audioDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            onClick={() => {
                              switchDevice("audio", device.deviceId);
                              setMicDropdownOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-[#3a3a3a] transition-colors"
                          >
                            <span className="text-white/70 text-sm truncate pr-2">
                              {device.label}
                            </span>
                            {device.deviceId === selectedAudioDevice && (
                              <Check className="w-4 h-4 text-white/50 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
