"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  RotateCcw,
  TrendingUp,
  Settings,
  Sparkles,
  Plus,
  LogOut,
  User as UserIcon,
  Tag,
} from "lucide-react";

export type NavTab =
  | "overview"
  | "transactions"
  | "budgets"
  | "savings"
  | "recurring"
  | "insights"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAssistant: () => void;
  onOpenNewTx: () => void;
  onOpenCanIAfford: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  onOpenAssistant,
  onOpenNewTx,
  onOpenCanIAfford,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: LayoutDashboard },
    { id: "transactions" as NavTab, label: "Transactions", icon: ArrowLeftRight },
    { id: "budgets" as NavTab, label: "Budgets", icon: PieChart },
    { id: "savings" as NavTab, label: "Savings", icon: Target },
    { id: "recurring" as NavTab, label: "Recurring", icon: RotateCcw },
    { id: "insights" as NavTab, label: "Insights", icon: TrendingUp },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col justify-between border-r border-[#EAEAEA] bg-[#FFFFFF] h-screen sticky top-0 px-4 py-6 select-none">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171717] text-white font-mono text-sm font-semibold shadow-xs">
              P
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#171717]">
                PaisaWise
              </span>
              <span className="block text-[10px] text-[#A3A3A3] font-mono tracking-wider uppercase">
                Finance OS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#EAEAEA] text-[#737373] bg-[#FAFAFA]">
            {user?.currency || "INR"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="px-1 space-y-1.5">
          <button
            onClick={onOpenNewTx}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#171717] py-2 px-3 text-xs font-medium text-white hover:bg-neutral-800 active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={onOpenCanIAfford}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-[#171717] bg-[#FAFAFA] py-1.5 px-3 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-all"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Price & Buy Oracle</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col space-y-1">
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#171717] text-white"
                    : "text-[#737373] hover:bg-[#F4F4F4] hover:text-[#171717]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer & User Profile */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#EAEAEA]">
        {/* Assistant Shortcut */}
        <button
          onClick={onOpenAssistant}
          className="flex w-full items-center justify-between rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-2.5 py-2 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#171717]" />
            <span>AI Assistant</span>
          </div>
          <span className="text-[10px] font-mono text-[#A3A3A3] border border-[#EAEAEA] px-1 rounded bg-white">
            Ask
          </span>
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#FAFAFA] transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] border border-[#EAEAEA] text-xs font-medium text-[#171717]">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#171717]">
                {user?.name || "Demo User"}
              </p>
              <p className="truncate text-[11px] text-[#A3A3A3]">
                {user?.email || "demo@paisawise.local"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex h-7 w-7 items-center justify-center rounded text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4] transition-colors"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

