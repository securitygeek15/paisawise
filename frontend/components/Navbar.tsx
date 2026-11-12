"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Menu, Tag } from "lucide-react";

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenAssistant: () => void;
  onOpenNewTx: () => void;
  onOpenCanIAfford: () => void;
}

export function Navbar({ onOpenMobileMenu, onOpenAssistant, onOpenNewTx, onOpenCanIAfford }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#EAEAEA] bg-[#FFFFFF]/90 px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#171717] hover:bg-[#F4F4F4] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#171717] text-white font-mono text-xs font-semibold">
            P
          </div>
          <span className="font-semibold tracking-tight text-[#171717]">PaisaWise</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenCanIAfford}
          className="flex h-8 items-center gap-1 rounded-md border border-[#171717] bg-[#FAFAFA] px-2 text-xs font-medium text-[#171717] hover:bg-[#F4F4F4] transition-colors"
          title="Price & Buy Oracle"
        >
          <Tag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Price Oracle</span>
        </button>

        <button
          onClick={onOpenNewTx}
          className="flex h-8 items-center gap-1 rounded-md bg-[#171717] px-2.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          <span>+ Add</span>
        </button>
      </div>
    </header>
  );
}

