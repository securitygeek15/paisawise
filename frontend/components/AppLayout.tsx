"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar, NavTab } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { AuthModal } from "./AuthModal";
import { AssistantModal } from "./AssistantModal";
import { AddTransactionModal } from "./AddTransactionModal";
import { OverviewView } from "./views/OverviewView";
import { TransactionsView } from "./views/TransactionsView";
import { BudgetsView } from "./views/BudgetsView";
import { SavingsView } from "./views/SavingsView";
import { RecurringView } from "./views/RecurringView";
import { InsightsView } from "./views/InsightsView";
import { SettingsView } from "./views/SettingsView";
import { Transaction } from "@/lib/types";

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");

  // Modals
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Global refresh counter for triggering re-fetches across views
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenNewTx = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleTxSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] text-white font-mono text-sm font-semibold">
            P
          </div>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#FAFAFA]">
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] text-[#171717]">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenNewTx={handleOpenNewTx}
      />

      {/* Mobile Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenNewTx={handleOpenNewTx}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8 pb-24 md:pb-12">
          {currentTab === "overview" && (
            <OverviewView
              key={refreshTrigger}
              onNavigate={setCurrentTab}
              onOpenNewTx={handleOpenNewTx}
              onOpenAssistant={() => setIsAssistantOpen(true)}
            />
          )}

          {currentTab === "transactions" && (
            <TransactionsView
              onOpenNewTx={handleOpenNewTx}
              onEditTx={handleEditTx}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentTab === "budgets" && <BudgetsView key={refreshTrigger} />}

          {currentTab === "savings" && <SavingsView key={refreshTrigger} />}

          {currentTab === "recurring" && <RecurringView key={refreshTrigger} />}

          {currentTab === "insights" && <InsightsView key={refreshTrigger} />}

          {currentTab === "settings" && <SettingsView />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenNewTx={handleOpenNewTx}
      />

      {/* Modals */}
      <AssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={handleTxSuccess}
        editTransaction={editingTx}
      />
    </div>
  );
}

