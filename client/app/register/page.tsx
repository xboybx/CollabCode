"use client";

import axios from 'axios';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React from 'react';

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
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            {/* Our Custom CSS Glassmorphism Panel */}
            <div className="glass-panel w-full max-w-md p-8 space-y-8 animate-slide-up">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Create an Account</h1>
                    <p className="text-text-muted mt-2">Start coding collaboratively in seconds.</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted ml-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main"
                            placeholder="jeswa77"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main"
                            placeholder="jeswa@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                    >
                        {loading ? "Registering..." : "Sign Up"}
                    </button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-surface px-2 text-text-muted">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => signIn("github", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-4 py-2 border border-border rounded-xl hover:bg-surface transition-all text-sm font-medium"
                    >
                        GitHub
                    </button>
                    {/* <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex items-center justify-center px-4 py-2 border border-border rounded-xl hover:bg-surface transition-all text-sm font-medium"
                    >
                        Google
                    </button> */}
                </div>

                <p className="text-center text-sm text-text-muted pt-2">
                    Already have an account? <a href="/login" className="text-primary hover:underline font-semibold">Login</a>
                </p>
            </div>
        </div>
    );
}

