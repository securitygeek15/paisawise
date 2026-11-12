"use client";

import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { X } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: Transaction | null;
}

const DEFAULT_CATEGORIES = [
  "Housing & Rent",
  "Groceries & Food",
  "Dining & Cafes",
  "Utilities & Internet",
  "Transportation",
  "Entertainment & Subs",
  "Health & Fitness",
  "Shopping",
  "Salary",
  "Freelance",
  "Investments",
  "Education",
  "Travel",
  "Other",
];

const PAYMENT_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Cash",
  "Net Banking",
];

export function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  editTransaction,
}: AddTransactionModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Groceries & Food");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTransaction) {
      setName(editTransaction.name);
      setAmount(String(editTransaction.amount));
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setDateStr(editTransaction.transaction_date);
      setPaymentMethod(editTransaction.payment_method);
      setNotes(editTransaction.notes || "");
    } else {
      setName("");
      setAmount("");
      setType("expense");
      setCategory("Groceries & Food");
      setDateStr(new Date().toISOString().split("T")[0]);
      setPaymentMethod("UPI");
      setNotes("");
    }
    setError(null);
  }, [editTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a transaction title");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        amount: parsedAmount.toFixed(2),
        type,
        category,
        transaction_date: dateStr,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (editTransaction) {
        await apiRequest(`/api/transactions/${editTransaction.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl border border-[#EAEAEA] bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#171717]">
              {editTransaction ? "Edit Transaction" : "Add Transaction"}
            </h3>
            <p className="text-[11px] text-[#737373]">
              Record new income or expense with category tag
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50/50 p-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Income vs Expense toggle */}
          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  if (category === "Salary" || category === "Freelance") {
                    setCategory("Groceries & Food");
                  }
                }}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  type === "expense"
                    ? "bg-[#171717] text-white border-[#171717]"
                    : "border-[#EAEAEA] bg-white text-[#737373] hover:bg-[#F4F4F4]"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategory("Salary");
                }}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  type === "income"
                    ? "bg-[#171717] text-white border-[#171717]"
                    : "border-[#EAEAEA] bg-white text-[#737373] hover:bg-[#F4F4F4]"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Title / Description
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Swiggy Gourmet, Monthly Rent, Freelance Retainer"
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with Rohan, work expense"
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : editTransaction ? "Update Record" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

