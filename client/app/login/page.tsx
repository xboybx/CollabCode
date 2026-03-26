"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React from 'react';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.log("Error in Login Handler", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-panel w-full max-w-md p-8 space-y-8 animate-slide-up">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-main tracking-tight">
            Welcome Back
          </h1>
          <p className="text-text-muted mt-2">
            Log in to your collaborative workspace.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary outline-none text-text-main"
              placeholder="jeswa@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary outline-none text-text-main"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-muted">
              Or continue with
            </span>
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

        <p className="text-center text-sm text-text-muted">
          New here?{" "}
          <a href="/register" className="text-primary hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}