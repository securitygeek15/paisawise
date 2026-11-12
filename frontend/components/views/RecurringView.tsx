"use client";

import React, { useState, useEffect } from "react";
import { RecurringPayment, RecurringListResponse } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  RotateCcw,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Info,
  X,
} from "lucide-react";

const FREQUENCIES = [
  { id: "monthly", label: "Monthly" },
  { id: "weekly", label: "Weekly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

const RECURRING_CATEGORIES = [
  "Housing & Rent",
  "Utilities & Internet",
  "Entertainment & Subs",
  "Health & Fitness",
  "Investments",
  "Insurance",
  "Education",
  "Other",
];

export function RecurringView() {
  const { user } = useAuth();
  const [data, setData] = useState<RecurringListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "quarterly" | "yearly">("monthly");
  const [nextDate, setNextDate] = useState("");
  const [category, setCategory] = useState("Utilities & Internet");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<RecurringListResponse>("/api/recurring");
      setData(res);
    } catch (err) {
      console.error("Failed to load recurring payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const openCreateModal = () => {
    setEditingPayment(null);
    setName("");
    setAmount("");
    setFrequency("monthly");
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNextDate(d.toISOString().split("T")[0]);
    setCategory("Utilities & Internet");
    setStatus("active");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: RecurringPayment) => {
    setEditingPayment(p);
    setName(p.name);
    setAmount(String(p.amount));
    setFrequency(p.frequency);
    setNextDate(p.next_payment_date);
    setCategory(p.category);
    setStatus(p.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setModalError("Please enter a valid amount");
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        name: name.trim(),
        amount: amt.toFixed(2),
        frequency,
        next_payment_date: nextDate,
        category,
        status,
      };

      if (editingPayment) {
        await apiRequest(`/api/recurring/${editingPayment.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/recurring", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchRecurring();
    } catch (err: any) {
      setModalError(err.message || "Failed to save recurring payment");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (payment: RecurringPayment) => {
    const newStatus = payment.status === "active" ? "paused" : "active";
    try {
      await apiRequest(`/api/recurring/${payment.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRecurring();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/recurring/${id}`, { method: "DELETE" });
      setDeletingId(null);
      fetchRecurring();
    } catch (err) {
      console.error("Failed to delete recurring payment", err);
    }
  };

  const currency = user?.currency || "INR";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Recurring Payments & Subscriptions
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Monitor ongoing commitments, dues, utility charges, and memberships.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Recurring Payment</span>
        </button>
      </div>

      {/* 2. Tracking Notice (Explicit Requirement from Spec Section 8) */}
      <div className="flex items-start gap-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4 text-xs text-[#737373]">
        <Info className="h-4 w-4 text-[#171717] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#171717]">Tracking & Reminder Notice:</strong>{" "}
          PaisaWise is a tracking and reminder system. It does not automatically initiate bank transfers, auto-debit accounts, or move funds. Mark your payments when executed.
        </p>
      </div>

      {/* 3. Metrics Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Estimated Monthly Outflow
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#171717]">
            {formatCurrency(data?.estimated_monthly_expenditure ?? 0, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Normalized monthly cost of all active subscriptions
          </p>
        </div>

        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Active Subscriptions
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#171717]">
            {data?.active_count ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Currently scheduled recurring commitments
          </p>
        </div>

        <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
            Total Tracked
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-[#171717]">
            {data?.total_count ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-[#A3A3A3]">
            Including paused and active items
          </p>
        </div>
      </div>

      {/* 4. Subscriptions List */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white shadow-2xs overflow-hidden">
        {loading && !data ? (
          <div className="flex h-48 items-center justify-center text-xs text-[#737373]">
            Loading recurring payments...
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#737373]">
            No recurring payments or subscriptions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {data?.items.map((item) => {
              const isPaused = item.status === "paused";
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 hover:bg-[#FAFAFA] transition-colors ${
                    isPaused ? "opacity-60 bg-neutral-50/50" : ""
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#171717]">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[#EAEAEA] bg-[#F4F4F4] text-[#737373] capitalize">
                        {item.frequency}
                      </span>
                      {isPaused && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-neutral-300 bg-neutral-100 text-neutral-600">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#737373]">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>Next due: {formatDate(item.next_payment_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right font-mono">
                      <p className="text-sm font-bold text-[#171717]">
                        {formatCurrency(item.amount, currency)}
                      </p>
                      <p className="text-[10px] text-[#A3A3A3] capitalize">
                        per {item.frequency === "monthly" ? "month" : item.frequency === "yearly" ? "year" : item.frequency === "weekly" ? "week" : "quarter"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 border-l border-[#EAEAEA] pl-3">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="rounded p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4]"
                        title={isPaused ? "Resume schedule" : "Pause schedule"}
                      >
                        {isPaused ? (
                          <PlayCircle className="h-4 w-4" />
                        ) : (
                          <PauseCircle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="rounded p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4]"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="rounded p-1 text-[#737373] hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-[#171717]">
                {editingPayment ? "Edit Recurring Payment" : "Add Recurring Payment"}
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

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Name / Provider
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fiber Broadband, Cult.fit, SIP"
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
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
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1200.00"
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
                  >
                    {RECURRING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("active")}
                    className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      status === "active"
                        ? "bg-[#171717] text-white border-[#171717]"
                        : "border-[#EAEAEA] bg-white text-[#737373] hover:bg-[#F4F4F4]"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("paused")}
                    className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      status === "paused"
                        ? "bg-[#171717] text-white border-[#171717]"
                        : "border-[#EAEAEA] bg-white text-[#737373] hover:bg-[#F4F4F4]"
                    }`}
                  >
                    Paused
                  </button>
                </div>
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
                  {modalLoading ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <h4 className="text-sm font-semibold text-[#171717]">
              Delete this subscription?
            </h4>
            <p className="mt-1 text-xs text-[#737373]">
              It will no longer appear in your recurring expenses forecast.
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

