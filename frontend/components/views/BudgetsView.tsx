"use client";

import React, { useState, useEffect } from "react";
import { Budget } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";

const PRESET_CATEGORIES = [
  "Housing & Rent",
  "Groceries & Food",
  "Dining & Cafes",
  "Utilities & Internet",
  "Transportation",
  "Entertainment & Subs",
  "Health & Fitness",
  "Shopping",
  "Education",
  "Travel",
  "Other",
];

export function BudgetsView() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState("Groceries & Food");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Budget[]>(
        `/api/budgets?month=${selectedMonth}&year=${selectedYear}`
      );
      setBudgets(res);
    } catch (err) {
      console.error("Failed to load budgets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setCategory("Groceries & Food");
    setCustomCategory("");
    setAmount("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setCustomCategory("");
    setAmount(String(b.amount));
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError("Please enter a valid amount greater than 0");
      return;
    }

    const finalCategory = category === "Custom" ? customCategory.trim() : category;
    if (!finalCategory) {
      setModalError("Please specify a category name");
      return;
    }

    setModalLoading(true);
    try {
      if (editingBudget) {
        await apiRequest(`/api/budgets/${editingBudget.id}`, {
          method: "PUT",
          body: JSON.stringify({ amount: parsedAmount.toFixed(2) }),
        });
      } else {
        await apiRequest("/api/budgets", {
          method: "POST",
          body: JSON.stringify({
            category: finalCategory,
            amount: parsedAmount.toFixed(2),
            month: selectedMonth,
            year: selectedYear,
          }),
        });
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      setModalError(err.message || "Failed to save budget");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/budgets/${id}`, { method: "DELETE" });
      setDeletingId(null);
      fetchBudgets();
    } catch (err) {
      console.error("Failed to delete budget", err);
    }
  };

  const currency = user?.currency || "INR";

  // Aggregated totals
  const totalAllocated = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent), 0);
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Budget Management
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Set monthly category spending caps to establish financial discipline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-white px-2 py-1 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#737373]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs text-[#171717] bg-transparent focus:outline-none cursor-pointer"
            >
              {[
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* 2. Budget Health Summary Card */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAEAEA]">
          <div className="sm:pr-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Total Allocated Budget
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#171717]">
              {formatCurrency(totalAllocated, currency)}
            </p>
          </div>
          <div className="pt-3 sm:pt-0 sm:px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Current Month Spent
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#171717]">
              {formatCurrency(totalSpent, currency)}
            </p>
          </div>
          <div className="pt-3 sm:pt-0 sm:pl-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                Remaining Available
              </p>
              <span className="text-[11px] font-mono text-[#737373]">
                {overallPercentage.toFixed(1)}% used
              </span>
            </div>
            <p
              className={`mt-1 text-xl font-bold font-mono ${
                totalAllocated - totalSpent < 0 ? "text-red-600" : "text-[#171717]"
              }`}
            >
              {formatCurrency(totalAllocated - totalSpent, currency)}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-[#F4F4F4] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallPercentage >= 100
                ? "bg-red-600"
                : overallPercentage >= 85
                ? "bg-amber-600"
                : "bg-[#171717]"
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* 3. Category Budgets Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-[#737373]">
          Loading category budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <p className="text-sm font-medium text-[#171717]">No budgets created yet</p>
          <p className="mt-1 text-xs text-[#737373]">
            Assign monthly limits to categories like Groceries, Rent, or Dining to track your progress.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const isOver = b.percentage >= 100;
            const isNear = b.percentage >= 85 && !isOver;

            return (
              <div
                key={b.id}
                className={`rounded-lg border bg-white p-5 shadow-2xs transition-all ${
                  isOver
                    ? "border-red-200"
                    : isNear
                    ? "border-amber-200"
                    : "border-[#EAEAEA]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#171717]">
                      {b.category}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isOver && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                          <AlertCircle className="h-3 w-3" />
                          Exceeded by {formatCurrency(Math.abs(Number(b.remaining)), currency)}
                        </span>
                      )}
                      {isNear && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          <AlertCircle className="h-3 w-3" />
                          Near limit ({b.percentage}%)
                        </span>
                      )}
                      {!isOver && !isNear && (
                        <span className="text-[10px] font-mono text-[#737373]">
                          {b.percentage}% consumed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="rounded p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4]"
                      title="Edit Limit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      className="rounded p-1 text-[#737373] hover:text-red-600 hover:bg-red-50"
                      title="Delete Budget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="mt-4 flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-[#171717]">
                    {formatCurrency(b.spent, currency)}
                  </span>
                  <span className="text-xs text-[#737373]">
                    limit {formatCurrency(b.amount, currency)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#EAEAEA] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? "bg-red-600"
                        : isNear
                        ? "bg-amber-600"
                        : "bg-[#171717]"
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="mt-2 text-right">
                  <span className="text-[11px] text-[#A3A3A3] font-mono">
                    {Number(b.remaining) >= 0 ? "Remaining: " : "Overspent: "}
                    {formatCurrency(Math.abs(Number(b.remaining)), currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create/Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-[#171717]">
                {editingBudget ? "Edit Category Budget" : "Set Category Budget"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-3">
              {!editingBudget && (
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                </div>
              )}

              {!editingBudget && category === "Custom" && (
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Pet Care"
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 12000.00"
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-md bg-[#171717] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Budget Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <h4 className="text-sm font-semibold text-[#171717]">
              Delete this budget?
            </h4>
            <p className="mt-1 text-xs text-[#737373]">
              The category limit will be removed for this month.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

