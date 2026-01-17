"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(
    null
  );

  const handleCreateMeeting = async () => {
    if (!name.trim()) {
      setShowNameInput(true);
      setPendingAction("create");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/meeting", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        const params = new URLSearchParams({ name: name.trim() });
        router.push(`/meeting/${data.meetingCode}?${params.toString()}`);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = () => {
    if (meetingCode.length < 10) return;

    if (!name.trim()) {
      setShowNameInput(true);
      setPendingAction("join");
      return;
    }

    setIsJoining(true);
    const params = new URLSearchParams({ name: name.trim() });
    router.push(`/meeting/${meetingCode.trim()}?${params.toString()}`);
  };

  const handleNameSubmit = () => {
    if (!name.trim()) return;

    if (pendingAction === "create") {
      handleCreateMeeting();
    } else if (pendingAction === "join") {
      handleJoinMeeting();
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="w-10" />
        <span className="text-white/20 font-regular text-sm">Home</span>
        <UserMenu />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 -mt-16">
        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#232323] rounded-lg p-6 w-80 border border-white/5">
              <h2 className="text-white font-semibold text-lg mb-4">
                Enter your name
              </h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-[#121212] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors mb-4"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    setShowNameInput(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleNameSubmit}
                  className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* New Meeting Button */}
        <motion.button
          onClick={handleCreateMeeting}
          disabled={isCreating}
          className="flex items-center h-10 px-8 py-3 bg-white hover:bg-white/90 disabled:bg-white/70 text-black font-medium text-base rounded-lg transition-colors"
          whileTap={!isCreating ? { scale: 0.97 } : undefined}
          initial={{ gap: 4 }}
          whileHover={!isCreating ? { gap: 8 } : { gap: 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>New Meeting</span>
              <Plus className="w-5 h-5" strokeWidth={3} />
            </>
          )}
        </motion.button>

        {/* OR Divider */}
        <span className="text-white font-semibold text-base tracking-tight">
          OR
        </span>

        {/* Join Meeting */}
        <div className="flex gap-1">
          <div className="relative">
            <input
              type="text"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="ent-meet-cod"
              className="w-52 h-10 px-3 py-3 bg-[#232323] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base"
              onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
            />
          </div>
          <motion.button
            onClick={handleJoinMeeting}
            disabled={isJoining || meetingCode.length < 10}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              meetingCode.length >= 10
                ? "bg-white hover:bg-white/90"
                : "bg-[#232323] border border-white/5"
            }`}
            initial="idle"
            whileHover={meetingCode.length >= 10 ? "hover" : "idle"}
            whileTap={meetingCode.length >= 10 ? { scale: 0.97 } : undefined}
            animate="idle"
          >
            {isJoining ? (
              <Loader2 className="w-5 h-5 text-black animate-spin" />
            ) : (
              <motion.span
                className="flex items-center justify-center"
                variants={{
                  idle: { x: 0 },
                  hover: { x: 2 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ArrowRight
                  className={`w-5 h-5 ${
                    meetingCode.length >= 10 ? "text-black" : "text-[#5D5D5D]"
                  }`}
                  strokeWidth={3}
                />
              </motion.span>
            )}
          </motion.button>
        </div>
      </main>
    </div>
  );
}
