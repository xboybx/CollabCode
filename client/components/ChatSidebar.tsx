"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useSession } from "next-auth/react";

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
}

interface ChatSidebarProps {
  chatWidth: number;
  startResizing: (e: React.MouseEvent) => void;
  onClose: () => void;
  socket: any;     // Accepting the TCP Pipe!
  roomId: string;  // Accepting the Room Bucket!
  messages: ChatMessage[];
  setMessages: any;
}

export default function ChatSidebar({ chatWidth, startResizing, onClose, socket, roomId, messages, setMessages }: ChatSidebarProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Developer";

  // The local text input state
  const [currentText, setCurrentText] = useState("");


  /* This takes the messages and builds message object array and send the latest current message to the backend */
  const sendMessage = () => {
    if (!currentText.trim() || !socket) return;

    // Build the message object
    const newMsg: ChatMessage = {
      senderId: socket.id,
      senderName: userName,
      message: currentText,
    };

    // 1. Add it to our own screen immediately
    setMessages((prev: any) => [...prev, newMsg]);

    // 2. Scream it down the pipe to the backend!
    socket.emit("send-chat-message", { roomId, message: currentText, senderName: userName });

    // Clear the input
    setCurrentText("");
  };

  return (
    <div
      className="h-full flex flex-col bg-[#0b0d19]/60 backdrop-blur-2xl shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.7)] z-20 relative border-l border-white/5"
      style={{ width: `${chatWidth}px` }}
    >
      <div onMouseDown={startResizing} className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors" />

      {/* Header */}
      <div className="h-14 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm font-bold text-white drop-shadow-md">
          <MessageSquare size={16} className="text-primary" />
          <h2>Room Chat</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-transparent hover:border-white/10">
          <X size={16} />
        </button>
      </div>

      {/* Message History (Loops infinitely through the array) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-transparent">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === socket?.id;
          return (
            <div key={idx} className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 mr-1">
                {isMe ? "You" : msg.senderName}
              </span>
              <div className={`px-4 py-2.5 text-sm backdrop-blur-md shadow-sm ${isMe ? 'bg-primary/30 border border-primary/40 text-blue-50 rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.25)]' : 'bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'}`}>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Field */}
      <div className="p-5 bg-black/20 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Message the team..."
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
          />
          <button onClick={sendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-primary to-indigo-500 hover:brightness-110 rounded-lg text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
