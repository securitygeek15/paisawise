"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, downloadFile } from "@/lib/api";
import {
  User,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
  Cpu,
} from "lucide-react";

export function SettingsView() {
  const { user, updateUser, logout } = useAuth();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Export state
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    setProfileLoading(true);

    try {
      const updated = await apiRequest<any>("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currency: currency.trim(),
        }),
      });
      updateUser(updated);
      setProfileMsg("Profile preferences updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);
    setPasswordLoading(true);

    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await downloadFile("/api/settings/export/csv", "paisawise_transactions.csv");
    } catch (err) {
      console.error("Export CSV failed", err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      await downloadFile(
        "/api/settings/export/summary-json",
        "paisawise_complete_backup.json"
      );
    } catch (err) {
      console.error("Export JSON failed", err);
    } finally {
      setExportingJson(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteLoading(true);
    try {
      await apiRequest("/api/auth/delete-account", { method: "DELETE" });
      logout();
    } catch (err) {
      console.error("Delete failed", err);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in-50 duration-300">
      {/* 1. Header */}
      <div className="border-b border-[#EAEAEA] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
          Settings & Data Management
        </h1>
        <p className="text-xs text-[#737373] mt-0.5">
          Configure account parameters, export records, and manage cryptographic authentication.
        </p>
      </div>

      {/* 2. Profile & Preferences */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAEAEA]">
          <User className="h-4 w-4 text-[#171717]" />
          <h2 className="text-sm font-semibold text-[#171717]">
            Account Preferences
          </h2>
        </div>

        {profileMsg && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}
        {profileError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#737373] mb-1">
                Interface Theme
              </label>
              <input
                type="text"
                disabled
                value="Monochrome Light (Default)"
                className="w-full rounded-md border border-[#EAEAEA] bg-[#F4F4F4] px-3 py-2 text-xs text-[#737373] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {profileLoading ? "Updating..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Data Portability & Exports */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAEAEA]">
          <Download className="h-4 w-4 text-[#171717]" />
          <h2 className="text-sm font-semibold text-[#171717]">
            Data Export & Portability
          </h2>
        </div>

        <p className="text-xs text-[#737373] mb-4">
          Export your entire verified financial history for external accounting, spreadsheet modeling, or local backups.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#EAEAEA] bg-[#FAFAFA] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#171717]">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Transactions (CSV)</span>
              </div>
              <p className="mt-1 text-[11px] text-[#737373]">
                Structured tabular file compatible with Excel, Google Sheets, and Numbers.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportingCsv ? "Preparing CSV..." : "Download CSV"}</span>
            </button>
          </div>

          <div className="rounded-md border border-[#EAEAEA] bg-[#FAFAFA] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#171717]">
                <FileCode className="h-4 w-4" />
                <span>Full System Backup (JSON)</span>
              </div>
              <p className="mt-1 text-[11px] text-[#737373]">
                Complete dump containing budgets, goals, recurring payments, and transactions.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              disabled={exportingJson}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportingJson ? "Generating JSON..." : "Download JSON"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Security & Password */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAEAEA]">
          <KeyRound className="h-4 w-4 text-[#171717]" />
          <h2 className="text-sm font-semibold text-[#171717]">
            Security & Authentication
          </h2>
        </div>

        {passwordMsg && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}
        {passwordError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#737373] mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-md border border-[#171717] bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {passwordLoading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* 4. Local AI Model Architecture */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#171717]" />
            <h2 className="text-sm font-semibold text-[#171717]">
              Local AI Engine & On-Device Processing
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
            100% Local
          </span>
        </div>

        <p className="text-xs text-[#737373] leading-relaxed">
          PaisaWise is architected to operate entirely on your own machine. Your financial records, transaction histories, and budgets are never transmitted to third-party cloud AI vendors.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <p className="text-[10px] uppercase font-mono text-[#737373]">Active Inference</p>
            <p className="text-xs font-semibold text-[#171717] mt-0.5">
              Ollama / Local Built-in Engine
            </p>
            <p className="text-[10px] text-[#A3A3A3] mt-1">
              Supports local LLMs (llama3.2, mistral, phi3) or instant on-device deterministic analytics.
            </p>
          </div>

          <div className="p-3 rounded border border-[#EAEAEA] bg-[#FAFAFA]">
            <p className="text-[10px] uppercase font-mono text-[#737373]">Data Isolation</p>
            <p className="text-xs font-semibold text-[#171717] mt-0.5">
              Zero External Telemetry
            </p>
            <p className="text-[10px] text-[#A3A3A3] mt-1">
              Runs offline. No cloud trackers, analytics beacons, or remote logging.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Danger Zone: Delete Account */}
      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 mb-2 border-b border-red-100">
          <Trash2 className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-semibold text-red-600">
            Danger Zone: Permanent Account Deletion
          </h2>
        </div>

        <p className="text-xs text-[#737373]">
          Permanently remove your account and purge all transactions, budgets, goals, and history. This action cannot be reversed.
        </p>

        <button
          onClick={() => {
            setDeleteConfirmText("");
            setShowDeleteModal(true);
          }}
          className="mt-4 rounded-md border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          Delete Account & Purge Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Confirm Irreversible Deletion</h3>
            </div>
            <p className="text-xs text-[#737373] leading-relaxed">
              Type <strong className="text-[#171717] font-mono">DELETE</strong> below to permanently erase your profile and records.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-3 w-full rounded-md border border-red-300 bg-red-50/30 px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-xs font-medium text-[#737373] hover:bg-[#F4F4F4]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                className="rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleteLoading ? "Purging..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

