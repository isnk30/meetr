"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SettingsModal from "./SettingsModal";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenSettings = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          whileTap={{ scale: 0.97 }}
        >
          <User className="w-4 h-4 text-[#121212]" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              style={{ transformOrigin: "top right" }}
              className="absolute right-0 top-full mt-2 p-1 bg-[#1E1E1E] border border-[#252525] rounded-xl shadow-[0px_7px_16px_rgba(0,0,0,0.14)] z-50"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1 px-1.5 py-1.5 w-[218px] rounded-lg hover:bg-[#2B2B2B] transition-colors"
                >
                  <User className="w-4 h-4 text-white/30" />
                  <span className="text-white/30 text-xs">Account</span>
                </button>
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center gap-1 px-1.5 py-1.5 w-[218px] rounded-lg hover:bg-[#2B2B2B] transition-colors"
                >
                  <Settings className="w-4 h-4 text-white/30" />
                  <span className="text-white/30 text-xs">Settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
