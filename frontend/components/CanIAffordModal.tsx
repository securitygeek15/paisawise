"use client";

import React, { useState, useEffect } from "react";
import { PriceCheckResponse } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Search,
  Bell,
  ArrowRight,
  ShieldCheck,
  Tag,
  Pencil,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface CanIAffordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordExpense?: (name: string, amount: string) => void;
}

const QUICK_TEST_PRODUCTS = [
  {
    label: "Hero Passion Bike (Flipkart)",
    url: "https://www.flipkart.com/hero-new-passion-booking-ex-showroom-price/p/itm88a44bac3e13c",
  },
  {
    label: "Sony XM5 (Amazon)",
    url: "https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH",
  },
  {
    label: "iPhone 15 (Flipkart)",
    url: "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4",
  },
  {
    label: "MacBook Air M2 (Amazon)",
    url: "https://www.amazon.in/Apple-MacBook-Laptop-chip-Liquid/dp/B0B3B3W56W",
  },
  {
    label: "Nike Air Force 1 (Myntra)",
    url: "https://www.myntra.com/casual-shoes/nike/nike-men-white-air-force-1-07-sneakers/13812836/buy",
  },
];

export function CanIAffordModal({
  isOpen,
  onClose,
  onRecordExpense,
}: CanIAffordModalProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState(QUICK_TEST_PRODUCTS[0].url);
  const [customName, setCustomName] = useState("");
  const [data, setData] = useState<PriceCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState("");

  const currency = user?.currency || "INR";

  const analyzeProduct = async (
    productUrl: string,
    name?: string,
    overridePrice?: number | null
  ) => {
    if (!productUrl.trim()) return;

    setLoading(true);
    setAlertSet(false);
    setIsEditingPrice(false);
    try {
      const res = await apiRequest<PriceCheckResponse>(
        "/api/analytics/price-check",
        {
          method: "POST",
          body: JSON.stringify({
            url: productUrl.trim(),
            custom_name: name?.trim() || null,
            override_price: overridePrice ?? null,
          }),
        }
      );
      setData(res);
      setManualPrice(String(res.current_price));
    } catch (err) {
      console.error("Price check failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      analyzeProduct(url);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeProduct(url, customName);
  };

  const handleApplyManualPrice = () => {
    const num = parseFloat(manualPrice);
    if (!isNaN(num) && num > 0) {
      analyzeProduct(url, customName, num);
    }
  };

  const handleSelectQuick = (testUrl: string) => {
    setUrl(testUrl);
    setCustomName("");
    setManualPrice("");
    analyzeProduct(testUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2.5 sm:p-4">
      <div className="w-full max-w-xl rounded-xl border border-[#EAEAEA] bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAEAEA] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#171717] text-white font-mono text-xs font-bold">
                P
              </span>
              <h2 className="text-base font-semibold tracking-tight text-[#171717]">
                Smart Buy & Price History Oracle
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#737373]">
              Paste any product link from Amazon, Flipkart, or Myntra to check historical pricing and your personal financial readiness.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#A3A3A3]" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Amazon, Flipkart, or Myntra product link..."
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] pl-8 pr-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0"
            >
              {loading ? "Analyzing..." : "Analyze Price"}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-mono mr-1">
              Sample Links:
            </span>
            {QUICK_TEST_PRODUCTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectQuick(p.url)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                  url === p.url
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] hover:text-[#171717] hover:border-[#A3A3A3]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </form>

        {/* Results Section */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
            <p className="text-xs text-[#737373]">
              Digging through 6-month historical price records on {url.includes("flipkart") ? "Flipkart" : url.includes("myntra") ? "Myntra" : "Amazon"}...
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="mt-5 space-y-4 pt-4 border-t border-[#EAEAEA] animate-in fade-in-50 duration-200">
            {/* 1. Product Metadata Card */}
            <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-[#171717] text-white text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-semibold">
                      {data.platform}
                    </span>
                    <span className="text-[11px] text-[#737373]">
                      Price History Verified
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#171717] leading-snug">
                    {data.product_name}
                  </h3>
                </div>

                <div className="text-left sm:text-right shrink-0 font-mono">
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs text-[#737373]">₹</span>
                      <input
                        type="number"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyManualPrice();
                          }
                        }}
                        className="w-24 rounded border border-[#171717] bg-white px-2 py-0.5 text-right font-mono text-xs font-bold text-[#171717] focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleApplyManualPrice}
                        className="rounded bg-[#171717] px-2 py-1 text-[10px] text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <p className="text-lg font-bold text-[#171717]">
                        {formatCurrency(data.current_price, currency)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setManualPrice(String(data.current_price));
                          setIsEditingPrice(true);
                        }}
                        title="Adjust price manually"
                        className="rounded p-1 text-[#A3A3A3] hover:text-[#171717] hover:bg-[#F4F4F4] transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {data.discount_from_high > 0 && (
                    <span className="inline-block mt-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                      {data.discount_from_high}% off peak
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Price Benchmark Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#EAEAEA] text-center font-mono">
                <div>
                  <p className="text-[10px] uppercase text-[#737373]">All-Time Low</p>
                  <p className="text-xs font-bold text-emerald-800">
                    {formatCurrency(data.all_time_low, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#737373]">Average Price</p>
                  <p className="text-xs font-bold text-[#171717]">
                    {formatCurrency(data.average_price, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#737373]">All-Time High</p>
                  <p className="text-xs font-bold text-red-800">
                    {formatCurrency(data.all_time_high, currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Buy Timing Verdict Badge */}
            <div
              className={`rounded-lg border p-4 ${
                data.timing_verdict === "BUY_NOW"
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                  : data.timing_verdict === "WAIT"
                  ? "border-amber-200 bg-amber-50/50 text-amber-950"
                  : "border-neutral-300 bg-neutral-50 text-neutral-900"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {data.timing_verdict === "BUY_NOW" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                )}
                {data.timing_verdict === "WAIT" && (
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                {data.timing_verdict === "FAIR" && (
                  <Clock className="h-5 w-5 text-neutral-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                    Market Timing: {data.timing_title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {data.timing_advice}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Price History Curve (6 Months Trend) */}
            <div className="rounded-lg border border-[#EAEAEA] p-4 bg-white">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-[#171717]">
                  6-Month Historical Price Fluctuation
                </span>
                <span className="text-[11px] font-mono text-[#737373]">
                  All-Time Low: {formatCurrency(data.all_time_low, currency)}
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history_points} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: "#EAEAEA" }}
                      tick={{ fontSize: 10, fill: "#737373" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#EAEAEA" }}
                      tick={{ fontSize: 10, fill: "#737373" }}
                      tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="rounded border border-[#EAEAEA] bg-white p-2 shadow-xs text-xs font-mono">
                              <p className="text-[#737373] text-[10px]">{p.date}</p>
                              <p className="font-bold text-[#171717]">
                                {formatCurrency(p.price, currency)}
                              </p>
                              {p.note && (
                                <p className="text-[10px] text-emerald-700 font-sans mt-0.5">
                                  {p.note}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#171717"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#171717" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Personal Financial Impact (Life Hours & Safe Spend) */}
            <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171717]">
                <ShieldCheck className="h-4 w-4" />
                <span>Your Personal Financial Reality Check</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded border border-[#EAEAEA] bg-white">
                  <span className="text-[11px] text-[#737373]">Cost in Work Time:</span>
                  <p className="text-sm font-bold text-[#171717] mt-0.5">
                    {data.work_time_formatted}
                  </p>
                  <p className="text-[10px] text-[#A3A3A3] font-mono">
                    Based on your ~₹{data.hourly_rate}/hr salary
                  </p>
                </div>

                <div className="p-2.5 rounded border border-[#EAEAEA] bg-white">
                  <span className="text-[11px] text-[#737373]">Daily Allowance After:</span>
                  <p
                    className={`text-sm font-bold mt-0.5 font-mono ${
                      data.affordability_verdict === "DANGER"
                        ? "text-red-600"
                        : "text-[#171717]"
                    }`}
                  >
                    ₹{data.daily_budget_after} / day
                  </p>
                  <p className="text-[10px] text-[#A3A3A3]">
                    Upcoming ₹{data.upcoming_bills} bills protected
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#737373] leading-relaxed">
                {data.affordability_advice}
              </p>
            </div>

            {/* 5. Next Steps Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#EAEAEA]">
              <button
                type="button"
                onClick={() => setAlertSet(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4] transition-colors"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{alertSet ? "Price Drop Alert Set!" : "Set Price Drop Alert"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View on {data.platform}</span>
                </a>

                {onRecordExpense && (
                  <button
                    type="button"
                    onClick={() => {
                      onRecordExpense(data.product_name, String(data.current_price));
                      onClose();
                    }}
                    className="flex-1 sm:flex-none rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
                  >
                    Record as Expense &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
