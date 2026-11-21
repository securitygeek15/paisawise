"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  Copy,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

interface ParsedTransaction {
  name: string;
  amount: number | string;
  type: "income" | "expense";
  category: string;
  transaction_date: string;
  payment_method: string;
  notes?: string;
  confidence?: number;
  raw_text?: string;
  selected?: boolean;
}

interface SmartSmsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const PRESET_SMS_SAMPLES = [
  {
    label: "HDFC Swiggy",
    text: "Rs 450.00 debited from a/c **1234 on 12-Nov-26 to VPA swiggy@icici (UPI Ref 431289123).",
  },
  {
    label: "ICICI Amazon",
    text: "Alert: You have spent INR 1,299.00 on ICICI Bank Credit Card ending 8812 at AMAZON INDIA on 10-NOV-2026.",
  },
  {
    label: "SBI Salary",
    text: "Your A/C 4321 is credited with INR 85,000.00 on 01-Nov-26 by Salary (Ref 998811).",
  },
  {
    label: "Blinkit Groceries",
    text: "Paid Rs. 680.00 to Blinkit using Google Pay UPI on 14-Nov-26.",
  },
  {
    label: "Uber Ride",
    text: "INR 350.00 spent on Axis Bank card at UBER INDIA on 13-Nov-26.",
  },
  {
    label: "Batch (All 5)",
    text: `Rs 450.00 debited from a/c **1234 on 12-Nov-26 to VPA swiggy@icici (UPI Ref 431289123).
Alert: You have spent INR 1,299.00 on ICICI Bank Credit Card ending 8812 at AMAZON INDIA on 10-NOV-2026.
Your A/C 4321 is credited with INR 85,000.00 on 01-Nov-26 by Salary (Ref 998811).
Paid Rs. 680.00 to Blinkit using Google Pay UPI on 14-Nov-26.
INR 350.00 spent on Axis Bank card at UBER INDIA on 13-Nov-26.`,
  },
];

const CATEGORIES = [
  "Dining & Cafes",
  "Groceries & Food",
  "Shopping",
  "Transportation",
  "Travel",
  "Entertainment & Subs",
  "Utilities & Internet",
  "Health & Fitness",
  "Salary",
  "Housing & Rent",
  "Education",
  "Investments",
  "Other",
];

export function SmartSmsImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: SmartSmsImportModalProps) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState(PRESET_SMS_SAMPLES[5].text);
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const currency = user?.currency || "INR";

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError("Please paste one or more bank SMS alerts.");
      return;
    }
    setError(null);
    setParsing(true);
    setSuccessCount(null);

    try {
      const res = await apiRequest<ParsedTransaction[]>(
        "/api/transactions/parse-sms",
        {
          method: "POST",
          body: JSON.stringify({ text: inputText.trim() }),
        }
      );
      setParsedItems(res.map((item) => ({ ...item, selected: true })));
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not detect valid transactions. Please verify the SMS alert format."
      );
    } finally {
      setParsing(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setParsedItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleFieldChange = (
    index: number,
    field: keyof ParsedTransaction,
    value: any
  ) => {
    setParsedItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleBatchImport = async () => {
    const selected = parsedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setError("Please select at least one transaction to import.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const payload = selected.map((item) => ({
        name: item.name.trim(),
        amount: parseFloat(String(item.amount)),
        type: item.type,
        category: item.category,
        transaction_date: item.transaction_date,
        payment_method: item.payment_method,
        notes: item.notes || null,
      }));

      const res = await apiRequest<{ imported_count: number }>(
        "/api/transactions/batch-import",
        {
          method: "POST",
          body: JSON.stringify({ transactions: payload }),
        }
      );

      setSuccessCount(res.imported_count);
      onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to batch import transactions.");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2.5 sm:p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#EAEAEA] bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAEAEA] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#171717] text-white font-mono text-xs font-bold">
                P
              </span>
              <h2 className="text-base font-semibold tracking-tight text-[#171717]">
                Smart Offline SMS &amp; Statement Parser
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#737373]">
              Paste SMS notifications from HDFC, SBI, ICICI, Axis, Paytm, or UPI. 100% on-device heuristic extraction with zero cloud sharing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preset Sample Chips */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-mono">
              Quick Sample Alerts:
            </span>
            <span className="text-[10px] text-[#737373] flex items-center gap-1 font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              100% Offline
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SMS_SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  setError(null);
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                  inputText === sample.text
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] hover:text-[#171717] hover:border-[#A3A3A3]"
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="mt-3 space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder="Paste one or multiple SMS alerts here..."
            className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] p-3 text-xs font-mono text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !inputText.trim()}
              className="flex items-center gap-1.5 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{parsing ? "Parsing On-Device..." : "Parse Transaction Alert(s)"}</span>
            </button>

            {parsedItems.length > 0 && (
              <span className="text-xs text-[#737373] font-mono">
                {parsedItems.length} transaction{parsedItems.length > 1 ? "s" : ""} detected
              </span>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Success notification */}
        {successCount !== null && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-medium">
              Successfully imported {successCount} transaction{successCount > 1 ? "s" : ""}!
            </p>
          </div>
        )}

        {/* Parsed Items Review Table */}
        {parsedItems.length > 0 && (
          <div className="mt-5 space-y-3 pt-4 border-t border-[#EAEAEA]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] font-mono">
                Review &amp; Batch Import
              </h3>
              <span className="text-[11px] text-[#737373]">
                {selectedCount} of {parsedItems.length} selected
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.selected
                      ? "border-[#EAEAEA] bg-white shadow-2xs"
                      : "border-dashed border-[#EAEAEA] bg-[#FAFAFA] opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(idx)}
                      className="mt-1 h-3.5 w-3.5 rounded border-[#A3A3A3] text-[#171717] focus:ring-0 cursor-pointer"
                    />

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {/* Name / Merchant */}
                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-[#A3A3A3] uppercase font-mono block">
                          Merchant / Beneficiary
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            handleFieldChange(idx, "name", e.target.value)
                          }
                          className="w-full text-xs font-medium text-[#171717] border-b border-transparent hover:border-[#EAEAEA] focus:border-[#171717] focus:outline-none bg-transparent py-0.5"
                        />
                      </div>

                      {/* Amount & Type */}
                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-[#A3A3A3] uppercase font-mono block">
                          Amount (₹)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                              item.type === "income"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {item.type === "income" ? (
                              <ArrowDownLeft className="h-2.5 w-2.5" />
                            ) : (
                              <ArrowUpRight className="h-2.5 w-2.5" />
                            )}
                          </span>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleFieldChange(idx, "amount", e.target.value)
                            }
                            className="w-full text-xs font-mono font-bold text-[#171717] border-b border-transparent hover:border-[#EAEAEA] focus:border-[#171717] focus:outline-none bg-transparent py-0.5"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-[#A3A3A3] uppercase font-mono block">
                          Category
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleFieldChange(idx, "category", e.target.value)
                          }
                          className="w-full text-xs text-[#171717] bg-transparent border-b border-transparent hover:border-[#EAEAEA] focus:border-[#171717] focus:outline-none py-0.5 cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date & Payment Method */}
                      <div className="sm:col-span-1 flex flex-col justify-between">
                        <label className="text-[10px] text-[#A3A3A3] uppercase font-mono block">
                          Date &amp; Method
                        </label>
                        <div className="flex items-center justify-between text-xs font-mono text-[#737373]">
                          <span>{item.transaction_date}</span>
                          <span className="rounded bg-[#FAFAFA] border border-[#EAEAEA] px-1.5 py-0.5 text-[10px]">
                            {item.payment_method}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEA]">
              <span className="text-xs text-[#737373]">
                Ready to commit to your local database.
              </span>

              <button
                type="button"
                onClick={handleBatchImport}
                disabled={importing || selectedCount === 0}
                className="flex items-center gap-1.5 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>
                  {importing
                    ? "Importing..."
                    : `Import ${selectedCount} Transaction${selectedCount > 1 ? "s" : ""}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
