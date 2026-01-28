"use client";

import { useState, useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { ArrowUp } from "lucide-react";
import { useAccentColor } from "@/contexts/AccentColorContext";

export interface ChatMessage {
  id: string;
  sender: string;
  senderIdentity: string;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const { localParticipant } = useLocalParticipant();
  const { accentColor } = useAccentColor();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInput = inputMessage.trim().length > 0;

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isLocal = msg.senderIdentity === localParticipant.identity;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isLocal ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">
                    {isLocal ? "You" : msg.sender}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    isLocal
                      ? "text-white"
                      : "bg-white/10 text-white"
                  }`}
                  style={isLocal ? { backgroundColor: accentColor } : undefined}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3 py-2.5 bg-[#232323] border border-white/5 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors text-base resize-none overflow-hidden"
          />
          <button
            onClick={sendMessage}
            disabled={!hasInput}
            className={`h-[44px] w-[44px] flex items-center justify-center rounded-lg transition-all shrink-0 ${
              hasInput
                ? "text-white hover:opacity-90"
                : "bg-[#232323] border border-white/5"
            }`}
            style={hasInput ? { backgroundColor: accentColor } : undefined}
          >
            <ArrowUp className={`w-5 h-5 ${hasInput ? "text-white" : "text-[#5D5D5D]"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
