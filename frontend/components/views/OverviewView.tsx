"use client";

import React, { useState, useEffect } from "react";
import { OverviewData } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { NavTab } from "../Sidebar";

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewTx: () => void;
  onOpenAssistant: () => void;
  onOpenCanIAfford: () => void;
}

export function OverviewView({
  onNavigate,
  onOpenNewTx,
  onOpenAssistant,
  onOpenCanIAfford,
}: OverviewViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchOverview = async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await apiRequest<OverviewData>(
        `/api/analytics/overview?month=${month}&year=${year}`
      );
      setData(res);
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Dynamic Greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currency = user?.currency || "INR";

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
          <p className="text-xs text-[#737373]">Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const recentTxs = data?.recent_transactions || [];
  const budgets = data?.budgets || [];
  const insights = data?.insights || [];
  const trends = data?.trends || [];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            {getGreeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Here&apos;s your financial overview for{" "}
            {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-white px-2 py-1 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#737373]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs text-[#171717] bg-transparent focus:outline-none cursor-pointer"
            >
              {[
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
              ].map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs text-[#171717] bg-transparent focus:outline-none cursor-pointer border-l border-[#EAEAEA] pl-1 ml-1"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenCanIAfford}
            className="flex items-center gap-1.5 rounded-md border border-[#171717] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-colors"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Price Oracle</span>
          </button>

          <button
            onClick={onOpenNewTx}
            className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            + Add Transaction
          </button>
        </div>
      </div>

      {/* 2. Financial Summary: 4 Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance (Visual Focal Point) */}
        <div className="rounded-lg border border-[#171717] bg-white p-5 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Total Balance
          </p>
          <p className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-[#171717] font-mono">
            {formatCurrency(summary?.total_balance ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Net cumulative liquidity across all accounts
          </p>
        </div>

        {/* Monthly Income */}
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Monthly Income
            </p>
            {summary?.income_change_pct !== null && summary?.income_change_pct !== undefined && (
              <span
                className={`flex items-center text-[10px] font-mono font-medium ${
                  summary.income_change_pct >= 0 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {summary.income_change_pct >= 0 ? "+" : ""}
                {summary.income_change_pct}% MoM
              </span>
            )}
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[#171717] font-mono">
            {formatCurrency(summary?.monthly_income ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Deposits & earnings recorded this month
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Monthly Expenses
            </p>
            {summary?.expense_change_pct !== null && summary?.expense_change_pct !== undefined && (
              <span
                className={`flex items-center text-[10px] font-mono font-medium ${
                  summary.expense_change_pct <= 0 ? "text-emerald-700" : "text-neutral-700"
                }`}
              >
                {summary.expense_change_pct >= 0 ? "+" : ""}
                {summary.expense_change_pct}% MoM
              </span>
            )}
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[#171717] font-mono">
            {formatCurrency(summary?.monthly_expenses ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Total outflows across all categories
          </p>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Net Savings
            </p>
            <span className="text-[10px] font-mono font-medium text-[#171717] bg-[#F4F4F4] px-1.5 py-0.5 rounded border border-[#EAEAEA]">
              {summary?.savings_rate ?? 0}% Rate
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[#171717] font-mono">
            {formatCurrency(summary?.monthly_savings ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Retained surplus after expenses
          </p>
        </div>
      </div>

      {/* Smart Buy & Price History Oracle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#EAEAEA] bg-white p-4 shadow-2xs hover:border-[#171717] transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-white">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#171717]">
              Smart Buy &amp; Price History Oracle
            </h3>
            <p className="text-[11px] text-[#737373]">
              Paste any product link (Amazon, Flipkart, Myntra) to inspect historical sale dips, timing verdicts, and personal financial readiness.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenCanIAfford}
          className="shrink-0 rounded-md bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto"
        >
          Check Product Price &rarr;
        </button>
      </div>

      {/* 3. Spending Trends Chart */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-3 border-b border-[#EAEAEA] gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">
              Spending Overview
            </h2>
            <p className="text-xs text-[#737373]">
              Daily distribution of income versus outgoing expenses
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
          {trends.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#737373]">
              No transactions recorded for this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3A3A3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#A3A3A3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "#EAEAEA" }}
                  tick={{ fontSize: 11, fill: "#737373" }}
                  tickFormatter={(val) => {
                    const parts = val.split("-");
                    return parts.length >= 3 ? `${parts[2]}` : val;
                  }}
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
                      const dt = payload[0].payload.date;
                      const exp = payload[0].value;
                      const inc = payload[1]?.value ?? 0;
                      return (
                        <div className="rounded-md border border-[#EAEAEA] bg-white p-2.5 shadow-md text-xs font-mono">
                          <p className="text-[11px] text-[#737373] mb-1 font-sans">{dt}</p>
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
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#171717"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#A3A3A3"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Two Column Layout: Recent Transactions & Budgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EAEAEA]">
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Recent Transactions
              </h2>
              <p className="text-xs text-[#737373]">Latest 5 recorded activities</p>
            </div>
            <button
              onClick={() => onNavigate("transactions")}
              className="flex items-center gap-1 text-xs font-medium text-[#171717] hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#737373]">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[#EAEAEA]">
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 hover:bg-[#FAFAFA] px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="truncate text-xs font-medium text-[#171717]">
                      {tx.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-[#737373]">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.transaction_date)}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] px-1 bg-[#F4F4F4] rounded border border-[#EAEAEA]">
                        {tx.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-medium font-mono ${
                        tx.type === "income" ? "text-emerald-700" : "text-[#171717]"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EAEAEA]">
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Monthly Budgets
              </h2>
              <p className="text-xs text-[#737373]">Category limits and consumption</p>
            </div>
            <button
              onClick={() => onNavigate("budgets")}
              className="flex items-center gap-1 text-xs font-medium text-[#171717] hover:underline"
            >
              <span>Manage</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#737373]">
              No budgets established for this month.
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((b) => {
                const isOver = b.percentage >= 100;
                const isNear = b.percentage >= 85 && !isOver;

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#171717]">{b.category}</span>
                        {isOver && (
                          <span className="text-[10px] font-mono px-1 py-0.2 bg-red-50 text-red-700 border border-red-200 rounded">
                            Exceeded
                          </span>
                        )}
                        {isNear && (
                          <span className="text-[10px] font-mono px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            Near Limit
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#737373]">
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-[#EAEAEA] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? "bg-red-600" : isNear ? "bg-amber-600" : "bg-[#171717]"
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Financial Insights (Calculated from real transaction data) */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#171717]" />
            <h2 className="text-sm font-semibold text-[#171717]">
              Financial Observations
            </h2>
          </div>
          <button
            onClick={onOpenAssistant}
            className="text-xs text-[#737373] hover:text-[#171717] transition-colors"
          >
            Ask AI Assistant &rarr;
          </button>
        </div>

        {insights.length === 0 ? (
          <p className="text-xs text-[#737373]">
            Add more transactions to generate statistical observations.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {insights.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs"
              >
                {item.type === "warning" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#171717] mt-0.5" />
                )}
                <span className="text-[#171717] leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

