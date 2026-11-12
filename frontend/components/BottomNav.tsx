"use client";

import React from "react";
import { NavTab } from "./Sidebar";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  MoreHorizontal,
} from "lucide-react";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
}

export function BottomNav({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
}: BottomNavProps) {
  const primaryTabs: { id: NavTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "budgets", label: "Budgets", icon: PieChart },
    { id: "savings", label: "Savings", icon: Target },
  ];

  const isMoreActive = ["recurring", "insights", "settings"].includes(currentTab);

  return (
    <nav className="fixed bottom-0 left-0 z-30 flex h-14 w-full items-center justify-around border-t border-[#EAEAEA] bg-[#FFFFFF]/95 px-2 backdrop-blur-md md:hidden">
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? "text-[#171717]" : "text-[#A3A3A3] hover:text-[#737373]"
            }`}
          >
            <Icon className={`h-4 w-4 mb-0.5 ${isActive ? "text-[#171717]" : "text-[#A3A3A3]"}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMobileMenu}
        className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
          isMoreActive ? "text-[#171717]" : "text-[#A3A3A3] hover:text-[#737373]"
        }`}
      >
        <MoreHorizontal className="h-4 w-4 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
}

