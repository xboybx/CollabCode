"use client";

import axios from 'axios';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React from 'react';
import { LogOut, Plus, Code2 } from "lucide-react";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post("/api/register", formData);
            if (res.status === 201) {
                // After successful registration, sign them in automatically
                await signIn("credentials", {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });
                router.push("/");
            }
        } catch (error: any) {
            console.log("Error while Registering: ", error);
            setError(error.response?.data?.message || "An error occurred during registration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full point-events-none opacity-50" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] bg-secondary/20 blur-[120px] rounded-full point-events-none opacity-50" />

            <div className="glass-panel w-full max-w-md p-8 sm:p-10 space-y-8 animate-slide-up z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl mb-2">
                        <Code2 size={24} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
                    <p className="text-text-muted text-sm font-medium tracking-tight">Join the next generation of collaborative coding.</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold text-center animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 group focus-within:translate-x-1 transition-transform duration-200">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-xl outline-none text-sm transition-all text-white placeholder:text-gray-600 shadow-inner"
                                placeholder="jeswa77"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 group focus-within:translate-x-1 transition-transform duration-200">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-xl outline-none text-sm transition-all text-white placeholder:text-gray-600 shadow-inner"
                                placeholder="jeswa@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 group focus-within:translate-x-1 transition-transform duration-200">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-xl outline-none text-sm transition-all text-white placeholder:text-gray-600 shadow-inner"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full overflow-hidden py-4 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(177,255,0,0.2)] active:scale-[0.98] mt-4"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? "Initializing..." : "Get Started"}
                        </div>
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                </form>

                <div className="relative flex items-center gap-3 opacity-40">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Quick Start</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <button
                    onClick={() => signIn("github", { callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-semibold active:scale-[0.98]"
                >
                    <span>Continue with GitHub</span>
                </button>

                <p className="text-center text-xs font-semibold text-text-muted pt-2 transition-all">
                    Already part of the crew?{" "} 
                    <a href="/login" className="text-primary hover:text-primary-hover hover:underline">Sign In</a>
                </p>
            </div>
        </div>
    );
}
