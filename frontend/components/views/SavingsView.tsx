"use client";

import React, { useState, useEffect } from "react";
import { SavingsGoal } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Coins,
  X,
  Clock,
} from "lucide-react";

export function SavingsView() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Contribute modal
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribLoading, setContribLoading] = useState(false);

  // Delete modal
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<SavingsGoal[]>("/api/savings");
      setGoals(res);
    } catch (err) {
      console.error("Failed to load savings goals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setTargetDate(d.toISOString().split("T")[0]);
    setDescription("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.target_amount));
    setCurrentAmount(String(g.current_amount));
    setTargetDate(g.target_date);
    setDescription(g.description || "");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const targetNum = parseFloat(targetAmount);
    const currentNum = parseFloat(currentAmount || "0");
    if (isNaN(targetNum) || targetNum <= 0) {
      setModalError("Please enter a valid target amount");
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: targetNum.toFixed(2),
        current_amount: currentNum.toFixed(2),
        target_date: targetDate,
        description: description.trim() || null,
      };

      if (editingGoal) {
        await apiRequest(`/api/savings/${editingGoal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/savings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      setModalError(err.message || "Failed to save savings goal");
    } finally {
      setModalLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;

    setContribLoading(true);
    try {
      await apiRequest(`/api/savings/${contributingGoal.id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount: amt.toFixed(2) }),
      });
      setContributingGoal(null);
      setContribAmount("");
      fetchGoals();
    } catch (err) {
      console.error("Failed to contribute", err);
    } finally {
      setContribLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/savings/${id}`, { method: "DELETE" });
      setDeletingId(null);
      fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const currency = user?.currency || "INR";

  // Aggregated totals
  const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);
  const totalCurrent = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);
  const overallPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Savings Goals
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Define future capital objectives and monitor accumulation milestones.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* 2. Portfolio Savings Summary */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAEAEA]">
          <div className="sm:pr-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Total Saved So Far
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#171717]">
              {formatCurrency(totalCurrent, currency)}
            </p>
          </div>
          <div className="pt-3 sm:pt-0 sm:px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Cumulative Target
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#171717]">
              {formatCurrency(totalTarget, currency)}
            </p>
          </div>
          <div className="pt-3 sm:pt-0 sm:pl-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                Remaining Gap
              </p>
              <span className="text-[11px] font-mono text-[#171717] bg-[#F4F4F4] px-1.5 py-0.5 rounded border border-[#EAEAEA]">
                {overallPct.toFixed(1)}% Achieved
              </span>
            </div>
            <p className="mt-1 text-xl font-bold font-mono text-[#171717]">
              {formatCurrency(Math.max(0, totalTarget - totalCurrent), currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#F4F4F4] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#171717] transition-all duration-300"
            style={{ width: `${Math.min(100, overallPct)}%` }}
          />
        </div>
      </div>

      {/* 3. Goals Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-[#737373]">
          Loading savings goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
          <p className="text-sm font-medium text-[#171717]">No savings goals yet</p>
          <p className="mt-1 text-xs text-[#737373]">
            Track objectives like an Emergency Fund, New Workstation, or Vacation.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {goals.map((g) => {
            const isCompleted = Number(g.current_amount) >= Number(g.target_amount);
            const today = new Date();
            const targetDateObj = new Date(g.target_date);
            const daysLeft = Math.ceil(
              (targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={g.id}
                className="rounded-lg border border-[#EAEAEA] bg-white p-5 shadow-2xs space-y-4 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#171717]">
                        {g.name}
                      </h3>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          <CheckCircle2 className="h-3 w-3" />
                          Achieved
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                        {g.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(g)}
                      className="rounded p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4]"
                      title="Edit Goal"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(g.id)}
                      className="rounded p-1 text-[#737373] hover:text-red-600 hover:bg-red-50"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress & Target */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-base font-bold text-[#171717]">
                      {formatCurrency(g.current_amount, currency)}
                    </span>
                    <span className="text-[#737373]">
                      target {formatCurrency(g.target_amount, currency)}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#F4F4F4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#171717] transition-all duration-300"
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Footer metadata & Contribute button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEA] text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {daysLeft > 0
                        ? `${daysLeft} days remaining (${formatDate(g.target_date)})`
                        : `Target reached ${formatDate(g.target_date)}`}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setContributingGoal(g);
                      setContribAmount("");
                    }}
                    className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-2.5 py-1 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-colors"
                  >
                    <Coins className="h-3 w-3" />
                    <span>+ Contribute</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-[#171717]">
                {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
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

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund (6 Months)"
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="200000.00"
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
                    Current Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Description / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 6 months living expenses"
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
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
                  {modalLoading ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Contribute Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <h4 className="text-sm font-semibold text-[#171717]">
              Contribute to {contributingGoal.name}
            </h4>
            <p className="mt-1 text-xs text-[#737373]">
              Add funds toward this savings milestone.
            </p>

            <form onSubmit={handleContribute} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  autoFocus
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="5000.00"
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contribLoading}
                  className="rounded-md bg-[#171717] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {contribLoading ? "Adding..." : "Add Funds"}
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
              Delete this savings goal?
            </h4>
            <p className="mt-1 text-xs text-[#737373]">
              This will remove this goal from your portfolio tracker.
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

