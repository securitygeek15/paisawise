"use client";

import React, { useState, useEffect } from "react";
import { AffordabilityResponse } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CanIAffordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordExpense?: (name: string, amount: string) => void;
}

const PRESET_CHECKS = [
  { label: "Dinner (₹850)", amount: "850", name: "Gourmet Dinner" },
  { label: "Sneakers (₹4,500)", amount: "4500", name: "Running Sneakers" },
  { label: "Gadget (₹24,900)", amount: "24900", name: "Tablet Upgrade" },
  { label: "Vacation (₹85,000)", amount: "85000", name: "Bali Vacation" },
];

export function CanIAffordModal({
  isOpen,
  onClose,
  onRecordExpense,
}: CanIAffordModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("4500");
  const [name, setName] = useState("Running Sneakers");
  const [result, setResult] = useState<AffordabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedWishlist, setCopiedWishlist] = useState(false);

  const currency = user?.currency || "INR";

  const evaluateAffordability = async (testAmt: string, testName: string) => {
    const parsed = parseFloat(testAmt);
    if (isNaN(parsed) || parsed <= 0) {
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<AffordabilityResponse>(
        "/api/analytics/can-i-afford",
        {
          method: "POST",
          body: JSON.stringify({
            amount: parsed.toFixed(2),
            name: testName || "Planned Purchase",
            category: "Shopping",
          }),
        }
      );
      setResult(res);
    } catch (err) {
      console.error("Affordability check failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      evaluateAffordability(amount, name);
    }
  }, [isOpen]);

  // Debounced live calculation as user types amount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && amount) {
        evaluateAffordability(amount, name);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [amount, name, isOpen]);

  if (!isOpen) return null;

  const handlePreset = (presetAmt: string, presetName: string) => {
    setAmount(presetAmt);
    setName(presetName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#EAEAEA] bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAEAEA] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#171717] text-white font-mono text-xs font-bold">
                ?
              </span>
              <h2 className="text-base font-semibold tracking-tight text-[#171717]">
                Can I Afford This?
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#737373]">
              Simulate purchase impact against live balance, upcoming bills, and life energy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="4500.00"
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-sm text-[#171717] font-mono focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Item / Impulse Buy
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Noise Cancelling Headphones"
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-mono mr-1">
              Try:
            </span>
            {PRESET_CHECKS.map((p) => (
              <button
                key={p.amount}
                type="button"
                onClick={() => handlePreset(p.amount, p.name)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                  amount === p.amount
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] hover:text-[#171717] hover:border-[#A3A3A3]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulation Card */}
        {result && (
          <div className="mt-5 space-y-4 pt-4 border-t border-[#EAEAEA] animate-in fade-in-50 duration-200">
            {/* Verdict Badge */}
            <div
              className={`rounded-lg border p-4 ${
                result.verdict === "SAFE"
                  ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                  : result.verdict === "CAUTION"
                  ? "border-amber-200 bg-amber-50/40 text-amber-950"
                  : "border-red-200 bg-red-50/40 text-red-950"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {result.verdict === "SAFE" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                )}
                {result.verdict === "CAUTION" && (
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                {result.verdict === "DANGER" && (
                  <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                    Verdict: {result.verdict} — {result.verdict_title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Reality Check Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Life Energy / Work Hours Cost */}
              <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                  <Clock className="h-3.5 w-3.5 text-[#171717]" />
                  <span>Cost in Working Life</span>
                </div>
                <p className="text-base font-bold text-[#171717]">
                  {result.work_time_formatted}
                </p>
                <p className="text-[10px] text-[#A3A3A3] font-mono">
                  At your verified ~₹{result.hourly_rate}/hr rate
                </p>
              </div>

              {/* 2. Daily Burn Rate Impact */}
              <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                  <TrendingDown className="h-3.5 w-3.5 text-[#171717]" />
                  <span>Daily Allowance Impact</span>
                </div>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xs text-[#737373] line-through">
                    ₹{result.daily_budget_before}
                  </span>
                  <ArrowRight className="h-3 w-3 text-[#A3A3A3]" />
                  <span
                    className={`text-base font-bold ${
                      result.verdict === "DANGER"
                        ? "text-red-600"
                        : result.verdict === "CAUTION"
                        ? "text-amber-700"
                        : "text-[#171717]"
                    }`}
                  >
                    ₹{result.daily_budget_after}
                  </span>
                  <span className="text-[10px] text-[#737373]">/ day</span>
                </div>
                <p className="text-[10px] text-[#A3A3A3]">
                  Across remaining {result.days_remaining} days of this month
                </p>
              </div>
            </div>

            {/* 3. Protection Breakdown */}
            <div className="rounded-md border border-[#EAEAEA] p-3 text-xs space-y-1.5 text-[#737373]">
              <div className="flex items-center justify-between">
                <span>Current Total Liquidity</span>
                <span className="font-mono font-medium text-[#171717]">
                  {formatCurrency(result.current_balance, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Earmarked Upcoming Bills (Rent, SIPs)</span>
                <span className="font-mono text-[#171717]">
                  - {formatCurrency(result.upcoming_bills, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-1.5 font-medium">
                <span>Remaining Free Discretionary Buffer</span>
                <span
                  className={`font-mono ${
                    Number(result.discretionary_after) < 0
                      ? "text-red-600 font-bold"
                      : "text-[#171717]"
                  }`}
                >
                  {formatCurrency(result.discretionary_after, currency)}
                </span>
              </div>
            </div>

            {/* Goal Impact Callout */}
            {result.goal_impact && (
              <div className="flex items-center gap-2 rounded-md bg-[#F4F4F4] px-3 py-2 text-[11px] text-[#171717] border border-[#EAEAEA]">
                <Sparkles className="h-3.5 w-3.5 text-[#171717] shrink-0" />
                <span>{result.goal_impact}</span>
              </div>
            )}

            {/* Next Steps Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#EAEAEA]">
              <button
                type="button"
                onClick={() => {
                  setCopiedWishlist(true);
                  setTimeout(() => setCopiedWishlist(false), 2000);
                }}
                className="w-full sm:w-auto rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4] transition-colors"
              >
                {copiedWishlist ? "Saved to 48h Cool-off!" : "Add to 48-Hour Wishlist"}
              </button>

              {onRecordExpense && (
                <button
                  type="button"
                  onClick={() => {
                    onRecordExpense(name, amount);
                    onClose();
                  }}
                  className="w-full sm:w-auto rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                >
                  Record as Expense Now &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
