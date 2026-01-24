"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Loader2, CircleAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(false);

  // Clear error after 5 seconds
  useEffect(() => {
    if (joinError) {
      const timer = setTimeout(() => {
        setJoinError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [joinError]);

  const handleCreateMeeting = async () => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/meeting", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/meeting/${data.meetingCode}?new=true`);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (meetingCode.length < 12) return;

    setIsJoining(true);
    setJoinError(false);

    try {
      // Validate the meeting code exists first
      const response = await fetch(`/api/meeting?code=${encodeURIComponent(meetingCode.trim())}`);
      const data = await response.json();

      if (!data.valid) {
        setJoinError(true);
        setIsJoining(false);
        return;
      }

      // Code is valid, navigate to meeting
      router.push(`/meeting/${meetingCode.trim()}`);
    } catch {
      setJoinError(true);
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
        <div className="w-8 sm:w-10" />
        <span className="text-white/20 font-regular text-sm">Welcome!</span>
        <UserMenu />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-6 -mt-8 sm:-mt-16 px-4 sm:px-0">
        {/* New Meeting Button */}
        <motion.button
          onClick={handleCreateMeeting}
          disabled={isCreating}
          className="flex items-center h-10 px-5 py-3 bg-white hover:bg-white/90 disabled:bg-white/70 text-black font-medium text-base rounded-lg transition-colors overflow-hidden"
          whileTap={!isCreating ? { scale: 0.97 } : undefined}
          initial={{ gap: 4 }}
          whileHover={!isCreating ? { gap: 8 } : { gap: 4 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCreating ? (
              <motion.span
                key="loading"
                className="flex items-center gap-2"
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                className="flex items-center gap-1"
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              >
                <span>New Meeting</span>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* OR Divider */}
        <span className="text-white font-semibold text-base tracking-tight">
          OR
        </span>

        {/* Join Meeting */}
        <div className="relative w-full max-w-[280px] sm:max-w-none sm:w-auto">
          <motion.div 
            className="flex items-center gap-1 relative z-10"
            layout
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div className="relative flex-1 sm:flex-none" layout>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => {
                  setMeetingCode(e.target.value);
                  setJoinError(false);
                }}
                placeholder="enter ten letter code"
                maxLength={12}
                className="w-full sm:w-52 h-10 px-3 py-3 bg-[#232323] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
                onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
              />
            </motion.div>
            <AnimatePresence mode="popLayout">
              {meetingCode.length > 0 && (
                <motion.button
                  onClick={handleJoinMeeting}
                  disabled={isJoining || meetingCode.length < 12}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors overflow-hidden ${
                    meetingCode.length >= 12
                      ? "bg-white hover:bg-white/90"
                      : "bg-[#232323] border border-white/5"
                  }`}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileHover={meetingCode.length >= 12 ? "hover" : undefined}
                  whileTap={meetingCode.length >= 12 ? { scale: 0.95 } : undefined}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isJoining ? (
                      <motion.span
                        key="loading"
                        className="flex items-center justify-center"
                        initial={{ opacity: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(4px)" }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <Loader2 className="w-5 h-5 text-black animate-spin" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        className="flex items-center justify-center"
                        variants={{
                          initial: { opacity: 0, filter: "blur(4px)", x: 0 },
                          animate: { opacity: 1, filter: "blur(0px)", x: 0 },
                          exit: { opacity: 0, filter: "blur(4px)", x: 0 },
                          hover: { x: 2 },
                        }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <ArrowRight
                          className={`w-5 h-5 ${
                            meetingCode.length >= 12 ? "text-black" : "text-[#5D5D5D]"
                          }`}
                          strokeWidth={2.5}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {joinError && (
              <motion.div
                className="absolute left-0 right-0 flex items-center justify-center gap-2 pt-3"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              >
                <CircleAlert className="w-4 h-4" style={{ color: "#E04141" }} />
                <span className="text-sm" style={{ color: "#E04141" }}>
                  Oops...invalid meeting code
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
