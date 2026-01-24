"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Color palette matching the design
export const ACCENT_COLORS = [
  { id: "pink", value: "#EC4899" },
  { id: "purple", value: "#A855F7" },
  { id: "blue", value: "#3B82F6" },
  { id: "green", value: "#22C55E" },
  { id: "yellow", value: "#EAB308" },
  { id: "orange", value: "#F97316" },
  { id: "red", value: "#EF4444" },
] as const;

export type AccentColorId = (typeof ACCENT_COLORS)[number]["id"];

interface AccentColorContextType {
  accentColor: string;
  accentColorId: AccentColorId;
  setAccentColor: (colorId: AccentColorId) => void;
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(undefined);

const STORAGE_KEY = "meetr-accent-color";
const DEFAULT_COLOR: AccentColorId = "blue";

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColorId, setAccentColorId] = useState<AccentColorId>(DEFAULT_COLOR);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_COLORS.some((c) => c.id === stored)) {
      setAccentColorId(stored as AccentColorId);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, accentColorId);
    }
  }, [accentColorId, isHydrated]);

  const setAccentColor = (colorId: AccentColorId) => {
    setAccentColorId(colorId);
  };

  const accentColor = ACCENT_COLORS.find((c) => c.id === accentColorId)?.value ?? ACCENT_COLORS[2].value;

  return (
    <AccentColorContext.Provider value={{ accentColor, accentColorId, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const context = useContext(AccentColorContext);
  if (context === undefined) {
    throw new Error("useAccentColor must be used within an AccentColorProvider");
  }
  return context;
}
