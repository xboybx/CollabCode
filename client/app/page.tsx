"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Code2 } from "lucide-react";
import React from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const createNewWorkspace = () => {
    // Generates a sleek 11-character random room code
    const newRoomId = Math.random().toString(36).substring(2, 13);
    router.push(`/room/${newRoomId}`);
  };

  const joinExistingRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roomId = formData.get("roomId") as string;

    if (roomId) {
      // Clean up the URL in case they pasted the whole thing by mistake
      const cleanId = roomId.split('/').pop()?.split('?')[0] || roomId;
      router.push(`/room/${cleanId}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary/30">

      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full point-events-none opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[150px] rounded-full point-events-none opacity-40 animate-pulse" />

      <div className="w-full max-w-md p-8 sm:p-10 glass-panel flex flex-col gap-10 text-center animate-slide-up z-10 relative">

        {/* Top Header Bar */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all">
              <Code2 size={24} className="text-primary" />
            </div>
            <div className="flex flex-col items-start translate-y-0.5">
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">SYNC SPACE</h1>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Launchpad v1.0</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 border border-white/5 rounded-xl transition-all shadow-inner group"
            title="Sign Out"
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* User Presence Section */}
        <div className="text-left bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary/30 to-secondary/30 border border-white/10 flex items-center justify-center text-primary font-black text-xl shadow-lg ring-4 ring-white/5">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black">Online Presence</p>
            </div>
            <h2 className="text-xl font-black text-white truncate max-w-[200px] tracking-tight">{session?.user?.name || "Developer"}</h2>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="flex flex-col gap-6 mt-2 relative">

          <button
            onClick={createNewWorkspace}
            className="group relative flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary-hover text-black py-4.5 rounded-2xl font-black text-[16px] transition-all shadow-[0_4px_30px_rgba(177,255,0,0.25)] hover:shadow-[0_8px_40px_rgba(177,255,0,0.4)] active:scale-[0.98] z-10"
          >
            <Plus size={22} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-500" />
            CREATE NEW ROOM
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-white/10 to-transparent pointer-events-none rounded-b-2xl" />
          </button>

          <div className="flex items-center gap-4 opacity-40 py-2">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Teleport</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={joinExistingRoom} className="flex gap-2 group/form">
            <div className="relative flex-1 group/input">
              <input
                name="roomId"
                type="text"
                placeholder="Enter Room Code..."
                required
                className="w-full bg-white/5 border border-white/5 group-focus-within/form:border-white/10 rounded-2xl px-6 py-4.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 text-white shadow-inner transition-all placeholder:text-gray-600 font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 rounded-2xl font-black text-sm transition-all active:scale-[0.96] flex items-center justify-center group/btn"
            >
              JOIN
            </button>
          </form>

        </div>

        {/* Subtle Footer Tag */}
        <div className="flex items-center justify-center gap-1.5 opacity-30">
          <p className="text-[9px] font-black tracking-widest uppercase text-primary">Encrypted Session Ready</p>
        </div>
      </div>
    </div>
  );
}
