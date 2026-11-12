"use client";

import React, { useState, useEffect } from "react";
import { DeepAnalyticsData } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export function InsightsView() {
  const { user } = useAuth();
  const [range, setRange] = useState<"month" | "quarter" | "year">("month");
  const [data, setData] = useState<DeepAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedRange: "month" | "quarter" | "year") => {
    setLoading(true);
    try {
      const res = await apiRequest<DeepAnalyticsData>(
        `/api/analytics/deep?range=${selectedRange}`
      );
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const currency = user?.currency || "INR";

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
          <p className="text-xs text-[#737373]">Calculating financial analytics...</p>
        </div>
      </div>
    );
  }

  const categories = data?.category_spending || [];
  const monthlyHistory = data?.monthly_history || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header & Range Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Insights & Analytics
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Deep quantitative analysis of cash flows, burn rate, and capital retention.
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-white p-1">
          <button
            onClick={() => setRange("month")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              range === "month"
                ? "bg-[#171717] text-white"
                : "text-[#737373] hover:text-[#171717]"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setRange("quarter")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              range === "quarter"
                ? "bg-[#171717] text-white"
                : "text-[#737373] hover:text-[#171717]"
            }`}
          >
            This Quarter
          </button>
          <button
            onClick={() => setRange("year")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              range === "year"
                ? "bg-[#171717] text-white"
                : "text-[#737373] hover:text-[#171717]"
            }`}
          >
            Full Year
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Total Inflow (Income)
          </p>
          <p className="mt-2 text-xl font-bold font-mono text-[#171717]">
            {formatCurrency(data?.total_income ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Verified earnings in period
          </p>
        </div>

        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Total Outflow (Expense)
          </p>
          <p className="mt-2 text-xl font-bold font-mono text-[#171717]">
            {formatCurrency(data?.total_expense ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Cumulative expenses incurred
          </p>
        </div>

        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Average Daily Spend
          </p>
          <p className="mt-2 text-xl font-bold font-mono text-[#171717]">
            {formatCurrency(data?.avg_daily_expense ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Normalized daily run-rate
          </p>
        </div>

        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Savings Rate
          </p>
          <p className="mt-2 text-xl font-bold font-mono text-[#171717]">
            {data?.savings_rate ?? 0}%
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Capital retained from earnings
          </p>
        </div>
      </div>

      {/* 3. Monthly Trends Chart (Annual View) */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#EAEAEA]">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">
              Cash Flow Dynamics (Income vs Outflow)
            </h2>
            <p className="text-xs text-[#737373]">
              Side-by-side progression across 12 calendar months
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#171717]" />
              <span className="text-[#737373]">Expense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#A3A3A3]" />
              <span className="text-[#737373]">Income</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "#EAEAEA" }}
                tick={{ fontSize: 11, fill: "#737373" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#EAEAEA" }}
                tick={{ fontSize: 11, fill: "#737373" }}
                tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const m = payload[0].payload.month;
                    const exp = payload[0].value;
                    const inc = payload[1]?.value ?? 0;
                    return (
                      <div className="rounded-md border border-[#EAEAEA] bg-white p-2.5 shadow-md text-xs font-mono">
                        <p className="text-[11px] text-[#737373] mb-1 font-sans">{m}</p>
                        <p className="text-[#171717] font-semibold">
                          Expense: {formatCurrency(Number(exp), currency)}
                        </p>
                        <p className="text-[#737373]">
                          Income: {formatCurrency(Number(inc), currency)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="expenses" fill="#171717" radius={[2, 2, 0, 0]} />
              <Bar dataKey="income" fill="#D4D4D4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Category-wise Spending Breakdown */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="pb-3 mb-4 border-b border-[#EAEAEA]">
          <h2 className="text-sm font-semibold text-[#171717]">
            Category Spending Breakdown
          </h2>
          <p className="text-xs text-[#737373]">
            Ranked distribution of expenditures by share of total outflow
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#737373]">
            No expense transactions found in this time range.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((c) => (
              <div key={c.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#171717]">{c.category}</span>
                    <span className="text-[10px] text-[#A3A3A3]">
                      ({c.transaction_count} {c.transaction_count === 1 ? "entry" : "entries"})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#171717] font-semibold">
                      {formatCurrency(c.amount, currency)}
                    </span>
                    <span className="text-[11px] text-[#737373] w-12 text-right">
                      {c.percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-[#F4F4F4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#171717] transition-all duration-300"
                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

