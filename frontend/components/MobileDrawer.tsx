"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { NavTab } from "./Sidebar";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  RotateCcw,
  TrendingUp,
  Settings,
  Sparkles,
  X,
  LogOut,
  Plus,
  HelpCircle,
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAssistant: () => void;
  onOpenNewTx: () => void;
  onOpenCanIAfford: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenAssistant,
  onOpenNewTx,
  onOpenCanIAfford,
}: MobileDrawerProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: LayoutDashboard },
    { id: "transactions" as NavTab, label: "Transactions", icon: ArrowLeftRight },
    { id: "budgets" as NavTab, label: "Budgets", icon: PieChart },
    { id: "savings" as NavTab, label: "Savings Goals", icon: Target },
    { id: "recurring" as NavTab, label: "Recurring Payments", icon: RotateCcw },
    { id: "insights" as NavTab, label: "Insights & Analytics", icon: TrendingUp },
    { id: "settings" as NavTab, label: "Settings & Security", icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col justify-between bg-white p-5 shadow-xl">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#171717] text-white font-mono text-xs font-semibold">
                P
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#171717]">
                PaisaWise
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewTx();
              }}
              className="flex items-center justify-center gap-2 rounded-md bg-[#171717] py-2 text-xs font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCanIAfford();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-[#171717] bg-[#FAFAFA] py-2 text-xs font-medium text-[#171717]"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Can I Afford This?</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAssistant();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] py-2 text-xs font-medium text-[#737373]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Assistant</span>
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col space-y-1">
            <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3]">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#171717] text-white"
                      : "text-[#737373] hover:bg-[#F4F4F4] hover:text-[#171717]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-[#EAEAEA] pt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#171717]">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[11px] text-[#A3A3A3]">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#737373] hover:bg-[#F4F4F4]"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

