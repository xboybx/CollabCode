"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";

interface VideoBubbleProps {
  onClose: () => void;
}

export default function VideoBubble({ onClose }: VideoBubbleProps) {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [videoPos, setVideoPos] = useState({ x: 0, y: 0 });
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  useEffect(() => {
    setIsClient(true);
    // Default position at bottom right
    setVideoPos({ x: window.innerWidth - 350, y: window.innerHeight - 300 });
  }, []);

  const startDraggingVideo = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    const startX = mouseDownEvent.clientX;
    const startY = mouseDownEvent.clientY;
    const startPosX = videoPos.x;
    const startPosY = videoPos.y;

    const onMouseMove = (e: MouseEvent) => {
      setVideoPos({
        x: startPosX + (e.clientX - startX),
        y: startPosY + (e.clientY - startY)
      });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [videoPos]);

  if (!isClient) return null;

  return (
    <div
      className="fixed flex flex-col bg-[#0b0d19]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] z-50 overflow-hidden"
      style={{
        width: '320px',
        minHeight: '200px',
        left: `${videoPos.x}px`,
        top: `${videoPos.y}px`,
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={startDraggingVideo}
        className="h-9 bg-white/5 border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0 transition-colors hover:bg-white/10"
      >
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-gray-300">
          <Video size={14} className="text-primary drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
          <span>Team Video</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-md border border-transparent hover:border-white/10">
          <X size={14} />
        </button>
      </div>

      {/* Video Content Area */}
      <div className="flex-1 p-2 grid grid-rows-2 gap-2 overflow-hidden bg-transparent relative">
        {/* Placeholder for Local Video */}
        <div className="relative w-full h-full group">
          <div className="w-full h-full bg-black/50 border border-white/5 shadow-inner rounded-xl overflow-hidden relative">
            {isCameraEnabled ? (
              <div className="w-full h-full object-cover bg-neutral-800 animate-pulse" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-sm tracking-widest uppercase">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
            {/* Soft inner glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            You
          </div>
        </div>

        {/* Placeholder for Remote Video */}
        <div className="relative w-full h-full group">
          <div className="w-full h-full bg-black/50 border border-white/5 shadow-inner rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-sm tracking-widest uppercase">
              Teammate
            </div>
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            Teammate
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="flex justify-center gap-2 shrink-0 p-2">
        <button
          onClick={() => setIsMicEnabled(!isMicEnabled)}
          className={`p-2.5 rounded-lg transition-all ${isMicEnabled ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
        >
          {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button
          onClick={() => setIsCameraEnabled(!isCameraEnabled)}
          className={`p-2.5 rounded-lg transition-all ${isCameraEnabled ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
        >
          {isCameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
      </div>
    </div>
  );
}
