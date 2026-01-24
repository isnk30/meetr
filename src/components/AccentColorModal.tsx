"use client";

import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ACCENT_COLORS, useAccentColor, type AccentColorId } from "@/contexts/AccentColorContext";

interface AccentColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccentColorModal({ isOpen, onClose }: AccentColorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { accentColorId, setAccentColor } = useAccentColor();

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

  const handleSelectColor = (colorId: AccentColorId) => {
    setAccentColor(colorId);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] bg-[#1E1E1E] border border-[#252525] rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white text-base font-medium">Accent Colour</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-white/50" />
              </motion.button>
            </div>

            {/* Color Picker */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                {ACCENT_COLORS.map((color) => {
                  const isSelected = color.id === accentColorId;
                  return (
                    <motion.button
                      key={color.id}
                      onClick={() => handleSelectColor(color.id)}
                      className="relative flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      {/* Selection ring */}
                      <div
                        className={`absolute w-10 h-10 rounded-full border-2 transition-opacity ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ borderColor: color.value }}
                      />
                      {/* Color circle */}
                      <div
                        className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
                        style={{ backgroundColor: color.value }}
                      />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
