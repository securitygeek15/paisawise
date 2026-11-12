"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export function AuthModal() {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name, email, password, currency);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || "Failed to load demo account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl border border-[#EAEAEA] bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Brand header */}
        <div className="text-center mb-6">
          <img
            src="/logo.svg"
            alt="PaisaWise"
            className="mx-auto mb-3 h-12 w-12 rounded-xl object-contain shadow-xs"
          />
          <h2 className="text-lg font-semibold tracking-tight text-[#171717]">
            {isRegister ? "Create your PaisaWise account" : "Welcome back to PaisaWise"}
          </h2>
          <p className="mt-1 text-xs text-[#737373]">
            {isRegister
              ? "Simple, disciplined personal finance tracking."
              : "Less interface. More clarity. Enter your credentials."}
          </p>
        </div>

        {/* Demo Account Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-between rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-left hover:bg-[#F4F4F4] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171717] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#171717]">
                  Explore Instant Demo Account
                </p>
                <p className="text-[11px] text-[#737373]">
                  Preloaded with realistic Indian fintech data
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#A3A3A3] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAEAEA]" />
          </div>
          <span className="relative bg-white px-2 text-[11px] text-[#A3A3A3] uppercase tracking-wider font-mono">
            or continue with email
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/50 p-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-md bg-[#171717] py-2 px-4 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-all"
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-[#737373] hover:text-[#171717] transition-colors"
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}

