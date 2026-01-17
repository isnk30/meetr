"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  senderIdentity: string;
  message: string;
  timestamp: Date;
}

export default function ChatPanel() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant: { identity: string; name?: string } | undefined) => {
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "chat") {
          const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            sender: participant?.name || participant?.identity || "Unknown",
            senderIdentity: participant?.identity || "unknown",
            message: data.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } catch (e) {
        console.error("Error parsing chat message:", e);
      }
    },
    [decoder]
  );

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, handleDataReceived]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const data = JSON.stringify({
      type: "chat",
      message: inputMessage.trim(),
    });

    // Add message locally
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: localParticipant.name || localParticipant.identity,
      senderIdentity: localParticipant.identity,
      message: inputMessage.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Send to all participants
    await localParticipant.publishData(encoder.encode(data), {
      reliable: true,
    });

    setInputMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white/10 text-white rounded-bl-sm"
                  }`}
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
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
