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
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-text-main relative overflow-hidden">

      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full point-events-none" />

      <div className="w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col gap-8 text-center animate-slide-up z-10 relative">

        {/* Header Section */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Code2 size={24} className="text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Sync Space</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* User Greet */}
        <div className="text-left bg-background/50 border border-border/50 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex flex-col items-center justify-center text-primary font-bold shadow-inner">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col">
            <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Welcome back</p>
            <h2 className="text-lg font-bold text-white">{session?.user?.name || "Developer"}</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-5 mt-2">

          <button
            onClick={createNewWorkspace}
            className="group flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-semibold text-[15px] transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            Create New Workspace
          </button>

          <div className="flex items-center gap-3 opacity-60">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted font-bold">Or Join Session</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={joinExistingRoom} className="flex gap-2">
            <input
              name="roomId"
              type="text"
              placeholder="Paste Room ID or URL..."
              required
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-text-main shadow-inner transition-shadow"
            />
            <button
              type="submit"
              className="bg-surface hover:bg-neutral-800 border border-border text-text-main hover:text-white px-5 rounded-xl font-semibold text-sm transition-all active:scale-[0.96]"
            >
              Join
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
