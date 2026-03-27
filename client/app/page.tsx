"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Code2, Users, Monitor, Video, Shield, Zap, ArrowRight, Activity } from "lucide-react";
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
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden selection:bg-primary/30 scroll-smooth">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[180px] rounded-full pointer-events-none opacity-40 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 blur-[180px] rounded-full pointer-events-none opacity-40 animate-pulse" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-secondary/5 blur-[120px] rounded-full pointer-events-none opacity-20" />

      {/* Modern Dashboard Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/50 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 hover:rotate-6">
              <Code2 size={24} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">COLLABCODE</h1>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Dashboard v2.0</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{session?.user?.name || "Developer"}</span>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-white/5 rounded-xl transition-all shadow-inner group"
              title="Sign Out"
            >
              <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-16 z-10">
        
        {/* Dashboard Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Hero & Description */}
          <div className="flex flex-col gap-8 animate-slide-up">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
                <Activity size={12} className="text-primary" />
                <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Real-Time Sync Enabled</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
                Code Together, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Faster and Smarter.</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl font-medium">
                The ultimate collaborative workspace for engineering teams. Write, review, and debug code in real-time with integrated video chat, shared terminal, and ultra-low latency synchronization.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <span className="text-white font-black text-2xl">Yjs+</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Core Engine</span>
              </div>
              <div className="w-px h-10 bg-white/10 mx-4" />
              <div className="flex flex-col gap-1">
                <span className="text-white font-black text-2xl">WebRTC</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Connectivity</span>
              </div>
              <div className="w-px h-10 bg-white/10 mx-4" />
              <div className="flex flex-col gap-1">
                <span className="text-white font-black text-2xl">Monaco</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Editor Base</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Action Cards */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 animate-slide-up animation-delay-300">
            
            {/* Create Room Card */}
            <div className="glass-panel p-8 group hover:border-primary/30 transition-all duration-500 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                <Plus size={120} strokeWidth={3} />
              </div>
              
              <div className="flex flex-col gap-2 relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Monitor size={24} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight pt-2">New Workspace</h3>
                <p className="text-gray-500 text-sm font-medium">Initialize a private, high-performance coding environment for your team.</p>
              </div>

              <button
                onClick={createNewWorkspace}
                className="w-full bg-primary hover:bg-primary-hover text-black py-4 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-[0_0_20px_rgba(177,255,0,0.3)] active:scale-[0.98] mt-2 relative z-10 flex items-center justify-center gap-2 overflow-hidden group/btn"
              >
                START CODING SESSION
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Join Room Card */}
            <div className="glass-panel p-8 group hover:border-secondary/30 transition-all duration-500 flex flex-col gap-6 relative">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight pt-2">Join Existing</h3>
                <p className="text-gray-500 text-sm font-medium">Already have a link? Paste it below to jump directly into the session.</p>
              </div>

              <form onSubmit={joinExistingRoom} className="flex flex-col gap-4 mt-2">
                <div className="relative group/input">
                  <input
                    name="roomId"
                    type="text"
                    placeholder="Workspace ID (e.g. ab12-cd34)"
                    required
                    className="w-full bg-white/5 border border-white/5 focus:border-secondary/50 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-secondary/10 text-white transition-all placeholder:text-gray-600 font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white/5 hover:bg-secondary/20 hover:text-secondary border border-white/10 hover:border-secondary/30 text-white py-4 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
                >
                  JOIN COLLABORATION
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Feature Highlights Section */}
        <section className="flex flex-col gap-10 pt-10 border-t border-white/5 animate-slide-up animation-delay-500">
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Capabilities</h4>
            <h3 className="text-3xl font-black text-white tracking-tight">Built for Next-Gen Collaboration</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform">
                <Zap size={20} />
              </div>
              <h5 className="text-lg font-black text-white">Zero Latency</h5>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Binary synchronization engine ensures your keystrokes reach others in milliseconds.</p>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:rotate-12 transition-transform">
                <Video size={20} />
              </div>
              <h5 className="text-lg font-black text-white">Integrated Video</h5>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Crystal clear P2P video and audio communication directly within your workspace.</p>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:rotate-12 transition-transform">
                <Shield size={20} />
              </div>
              <h5 className="text-lg font-black text-white">Secure Sessions</h5>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">Session-based encryption and admin controls keep your private codebase safe.</p>
            </div>
          </div>
        </section>

        {/* Subtle Footer Tag */}
        <footer className="mt-12 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">© 2026 COLLABCODE INC. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] font-black tracking-widest uppercase text-gray-500 hover:text-primary transition-colors">Safety Status</a>
            <a href="#" className="text-[10px] font-black tracking-widest uppercase text-gray-500 hover:text-primary transition-colors">Core Engine Docs</a>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-500 { animation-delay: 500ms; }
      `}</style>
    </div>
  );
}

