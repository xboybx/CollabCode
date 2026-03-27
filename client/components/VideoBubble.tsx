"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Mic, MicOff, Video, VideoOff, X, Maximize2, Minimize2, ChevronDown, ChevronUp, Users, Square } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal?: boolean;
}

interface VideoBubbleProps {
  onClose: () => void;
  socket: any;
  roomId: string;
}

function getGridCols(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

export default function VideoBubble({ onClose, socket, roomId }: VideoBubbleProps) {
  const { data: session } = useSession();
  const { localstreams, remotestreams, remoteCameraStates, toggleMic, toggleCamera } = useWebRTC(socket, roomId, session?.user?.name || "Someone");
  const [isClient, setIsClient] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 480, h: 400 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);


  // Controls hover visibility for 1v1 mode
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "local", name: session?.user?.name || "You", isMuted: false, isCameraOff: false, isLocal: true },
    // No more fake "peer-1" here — real remote users are added by the useEffect below
  ]);

  /*
   * Sync remotestreams → participants
   * Every time the remotestreams dictionary changes (someone joins or leaves video),
   * we rebuild the participants array to match the real connected users.
   * The local user always stays as the first entry.
   * Each remote key is their socket.id — that's the same key VideoPlayer uses to look up the stream.
   */
  useEffect(() => {
    const remoteSocketIds = Object.keys(remotestreams);
    setParticipants([
      { id: "local", name: session?.user?.name || "You", isMuted: !isMicEnabled, isCameraOff: !isCameraEnabled, isLocal: true },
      ...remoteSocketIds.map((id, index) => ({
        id: id,
        name: `Guest ${index + 1}`,
        isMuted: false,
        isCameraOff: remoteCameraStates[id] ?? false, // use the real signal from the remote user
        isLocal: false
      }))
    ]);
  }, [remotestreams, remoteCameraStates, session?.user?.name, isMicEnabled, isCameraEnabled]);

  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  // Keep a ref of pos so drag handler never has a stale closure
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  useEffect(() => {
    setIsClient(true);
    setPos({ x: window.innerWidth - 510, y: window.innerHeight - 440 });
  }, []);

  useEffect(() => {
    if (session?.user?.name) {
      setParticipants(prev =>
        prev.map(p => p.isLocal ? { ...p, name: session.user!.name! } : p)
      );
    }
  }, [session]);

  /* ── DRAG ── */
  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't initiate drag on button/select clicks
    if ((e.target as HTMLElement).closest('button,select')) return;
    e.preventDefault();
    const offsetX = e.clientX - posRef.current.x;
    const offsetY = e.clientY - posRef.current.y;
    const onMove = (ev: MouseEvent) => {
      // Clamp so the window never goes outside the viewport
      const maxX = window.innerWidth - size.w;
      const maxY = window.innerHeight - size.h;
      setPos({
        x: Math.min(Math.max(0, ev.clientX - offsetX), Math.max(0, maxX)),
        y: Math.min(Math.max(0, ev.clientY - offsetY), Math.max(0, maxY)),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  /* ── RESIZE ── */
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setSize({ w: Math.max(280, resizeRef.current.startW + ev.clientX - resizeRef.current.startX), h: Math.max(200, resizeRef.current.startH + ev.clientY - resizeRef.current.startY) });
    };
    const onUp = () => { resizeRef.current = null; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [size]);

  /* ── CONTROLS AUTO-HIDE in 1v1 ── */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  if (!isClient) return null;

  // Solo OR 1v1 both use the cinematic full-screen layout.
  // Group mode (3+) switches to the grid panel.
  const is1v1 = participants.length <= 2;
  const local = participants.find(p => p.isLocal)!;
  const remote = participants.find(p => !p.isLocal);

  const containerStyle = isExpanded
    ? { inset: 0, width: "100vw", height: "100vh", left: 0, top: 0, borderRadius: 0 }
    : { width: `${size.w}px`, height: isCollapsed ? "auto" : `${size.h}px`, left: `${pos.x}px`, top: `${pos.y}px` };

  /* ════════════════════════════════════════
     1v1 CINEMA MODE — no panels, just video
  ════════════════════════════════════════ */
  if (is1v1 && !isCollapsed) {
    return (
      <div
        className="fixed z-50 overflow-hidden transition-all duration-300 border-0 cursor-grab active:cursor-grabbing"
        style={{ ...containerStyle, borderRadius: isExpanded ? 0 : "1.25rem" }}
        onMouseDown={onDragMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Main area — remote video if connected, own camera if alone */}
        <div className="absolute inset-0 bg-[#0b0d19]">
          {!remote ? (
            // Solo: your own camera fills the screen
            <>
              {local.isCameraOff ? (
                <div className="w-full h-full flex items-center justify-center bg-[#12141f]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 text-white text-3xl font-bold flex items-center justify-center">
                      {local.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-400 text-sm font-medium">{local.name}</span>
                  </div>
                </div>
              ) : (
                <VideoPlayer stream={localstreams} isLocal={true} />
              )}
              {/* Waiting badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-white/40 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                Waiting for others to join...
              </div>
            </>
          ) : remote.isCameraOff ? (
            // Remote exists but camera is off — show avatar
            <div className="w-full h-full flex items-center justify-center bg-[#12141f]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 text-white text-3xl font-bold flex items-center justify-center">
                  {remote.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-400 text-sm font-medium">{remote.name}</span>
              </div>
            </div>
          ) : (
            // Remote exists and camera is on — show their live video
            <VideoPlayer stream={remotestreams[remote.id]} isLocal={false} />
          )}
        </div>

        {/* Local PiP — only show when a remote user exists, otherwise your video IS the main view */}
        {remote && (
          <div
            className="absolute bottom-14 right-3 w-28 h-20 rounded-xl overflow-hidden shadow-2xl"
            style={{ zIndex: 10 }}
          >
            {local.isCameraOff ? (
              <div className="w-full h-full flex items-center justify-center bg-[#1a1c29] text-white text-xl font-bold">
                {local.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <VideoPlayer stream={localstreams} isLocal={true} />
            )}
            {/* "You" label */}
            <div className="absolute bottom-1 left-1 text-[9px] text-white/60 font-medium bg-black/40 px-1.5 py-0.5 rounded">You</div>
          </div>
        )}

        {/* ── FLOATING CONTROLS (auto-hide) ── */}
        <div className={`absolute inset-x-0 bottom-0 flex flex-col items-center transition-opacity duration-300 ${showControls || !remote ? "opacity-100" : "opacity-0"}`}>
          {/* Gradient fade so controls are readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-between w-full px-3 pb-3 pt-6">
            {/* Drag handle removed from here — now handled by top strip */}

            {/* Left: empty — space reserved for future controls */}
            <div />

            {/* Center: Mic + Camera */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { toggleMic(); setIsMicEnabled(!isMicEnabled); setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isMuted: isMicEnabled } : p)); }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all ${isMicEnabled ? "bg-black/40 text-white/80 hover:bg-black/60" : "bg-red-500/50 text-white"}`}
              >
                {isMicEnabled ? <Mic size={15} /> : <MicOff size={15} />}
              </button>
              <button
                onClick={() => { const next = !isCameraEnabled; toggleCamera(!next); setIsCameraEnabled(next); setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isCameraOff: !next } : p)); }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all ${isCameraEnabled ? "bg-black/40 text-white/80 hover:bg-black/60" : "bg-red-500/50 text-white"}`}
              >
                {isCameraEnabled ? <Video size={15} /> : <VideoOff size={15} />}
              </button>
            </div>

            {/* Right: Collapse + Expand + Close */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIsCollapsed(true)} className="p-1.5 rounded-md bg-black/40 backdrop-blur-md text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                <ChevronDown size={13} />
              </button>
              <button onClick={() => { setIsExpanded(!isExpanded); }} className="p-1.5 rounded-md bg-black/40 backdrop-blur-md text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button onClick={onClose} className="p-1.5 rounded-md bg-black/40 backdrop-blur-md text-red-400/80 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all">
                <X size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Resize handle */}
        {!isExpanded && (
          <div onMouseDown={onResizeMouseDown} className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20 flex items-end justify-end pr-1 pb-1 group">
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/10 group-hover:border-[#b1ff00]/50 rounded-sm transition-colors" />
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════
     GROUP MODE (3+ people) or COLLAPSED
  ════════════════════════════════════════ */
  return (
    <div
      className="fixed flex flex-col bg-[#0b0d19]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
      style={{ ...containerStyle, borderRadius: isExpanded ? 0 : "1rem" }}
    >
      {/* Header */}
      <div
        onMouseDown={onDragMouseDown}
        className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0 select-none"
      >
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-gray-300">
          <Video size={13} className="text-[#b1ff00]" />
          <span>Team Video</span>
          <span className="ml-1 flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-400">
            <Users size={9} /> {participants.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors" title={isCollapsed ? "Expand" : "Collapse"}>
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button onClick={() => { setIsExpanded(!isExpanded); setIsCollapsed(false); }} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {!isCollapsed && (
        <div className={`flex-1 p-2 grid ${getGridCols(participants.length)} gap-2 overflow-y-auto min-h-0`}>
          {participants.map((participant) => (
            <div key={participant.id} className="relative group rounded-xl overflow-hidden bg-black/60 border border-white/5 min-h-[120px]">
              {participant.isCameraOff ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1c29]">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white text-lg font-bold flex items-center justify-center">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                participant.isLocal
                  ? <VideoPlayer stream={localstreams} isLocal={true} />
                  : <VideoPlayer stream={remotestreams[participant.id]} isLocal={false} />
              )}
              <div className="absolute inset-0 shadow-[inset_0_0_25px_rgba(0,0,0,0.6)] pointer-events-none rounded-xl" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/10">
                {participant.isMuted && <MicOff size={9} className="text-red-400" />}
                {participant.name}{participant.isLocal && <span className="text-[#b1ff00] ml-0.5">(You)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {!isCollapsed && (
        <div className="flex justify-center gap-2 shrink-0 p-2.5 border-t border-white/5 bg-black/20">
          <button
            onClick={() => { toggleMic(); setIsMicEnabled(!isMicEnabled); setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isMuted: isMicEnabled } : p)); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${isMicEnabled ? "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
          >
            {isMicEnabled ? <Mic size={13} /> : <MicOff size={13} />}
            {isMicEnabled ? "Mute" : "Unmute"}
          </button>
          <button
            onClick={() => { const next = !isCameraEnabled; toggleCamera(!next); setIsCameraEnabled(next); setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isCameraOff: !next } : p)); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${isCameraEnabled ? "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
          >
            {isCameraEnabled ? <Video size={13} /> : <VideoOff size={13} />}
            {isCameraEnabled ? "Stop" : "Start Video"}
          </button>
        </div>
      )}

      {/* Resize handle */}
      {!isExpanded && !isCollapsed && (
        <div onMouseDown={onResizeMouseDown} className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10 flex items-end justify-end pr-1 pb-1 group">
          <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/20 group-hover:border-[#b1ff00]/50 rounded-sm transition-colors" />
        </div>
      )}
    </div>
  );
}

/*
 * VideoPlayer Component
 *
 * Why a separate component?
 *   You cannot pass a MediaStream into a <video> tag as a React prop like src="..."
 *   because MediaStream is a live binary object, not a URL string.
 *   The only way to attach it is via the DOM property: videoElement.srcObject = stream
 *   This requires a ref to the actual DOM node, which only exists after the element mounts.
 *   So we use useEffect + useRef to set srcObject once the <video> tag is in the DOM.
 *
 * muted={isLocal} is critical:
 *   Never play your own microphone audio back to yourself.
 *   It would create a live echo loop in your own speakers.
 *
 * If stream is null (camera off or not yet connected), we show the pulsing placeholder.
 */
const VideoPlayer = ({ stream, isLocal }: { stream: MediaStream | null | undefined, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log("[🎬 VIDEOPLAYER] Attaching stream to <video> element. isLocal:", isLocal);
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return <div className="w-full h-full bg-neutral-800 animate-pulse" />;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className="w-full h-full object-cover"
    />
  );
};
