"use client";

import React, { useState, useEffect } from "react";
import { Transaction, TransactionListResponse } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from "lucide-react";

interface TransactionsViewProps {
  onOpenNewTx: () => void;
  onEditTx: (tx: Transaction) => void;
  refreshTrigger: number;
}

export function TransactionsView({
  onOpenNewTx,
  onEditTx,
  refreshTrigger,
}: TransactionsViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter and pagination state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await apiRequest<string[]>("/api/transactions/categories");
        setCategoriesList(cats);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    }
    loadCategories();
  }, [refreshTrigger]);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "15");
      params.append("sort_by", sortBy);
      params.append("order", order);

      if (search.trim()) params.append("search", search.trim());
      if (category !== "all") params.append("category", category);
      if (type !== "all") params.append("type", type);

      const res = await apiRequest<TransactionListResponse>(
        `/api/transactions?${params.toString()}`
      );
      setData(res);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, category, type, sortBy, order, refreshTrigger]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    try {
      await apiRequest(`/api/transactions/${id}`, { method: "DELETE" });
      setDeletingId(null);
      fetchTransactions();
    } catch (err) {
      console.error("Failed to delete transaction", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const currency = user?.currency || "INR";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEAEA] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Transactions
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Audit, filter, and organize every income and expenditure entry.
          </p>
        </div>

        <button
          onClick={onOpenNewTx}
          className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#EAEAEA] bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#A3A3A3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant, note, or payment method..."
              className="w-full rounded-md border border-[#EAEAEA] bg-[#FAFAFA] pl-8 pr-3 py-1.5 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#A3A3A3] hover:text-[#171717]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-[#EAEAEA] bg-white px-2.5 py-1.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Type Dropdown */}
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-[#EAEAEA] bg-white px-2.5 py-1.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}_${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split("_");
                setSortBy(s as "date" | "amount");
                setOrder(o as "desc" | "asc");
                setPage(1);
              }}
              className="rounded-md border border-[#EAEAEA] bg-white px-2.5 py-1.5 text-xs text-[#171717] focus:border-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Latest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Metrics */}
        {data?.summary && (
          <div className="flex flex-wrap items-center justify-between border-t border-[#EAEAEA] pt-3 text-xs font-mono text-[#737373]">
            <span>Showing {data.total_count} matching records</span>
            <div className="flex items-center gap-4">
              <span>
                Income:{" "}
                <strong className="text-emerald-700">
                  {formatCurrency(data.summary.total_income, currency)}
                </strong>
              </span>
              <span>
                Expenses:{" "}
                <strong className="text-[#171717]">
                  {formatCurrency(data.summary.total_expense, currency)}
                </strong>
              </span>
              <span>
                Net:{" "}
                <strong className="text-[#171717]">
                  {formatCurrency(data.summary.net, currency)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Transactions Table / List */}
      <div className="rounded-lg border border-[#EAEAEA] bg-white shadow-2xs overflow-hidden">
        {loading && !data ? (
          <div className="flex h-64 items-center justify-center text-xs text-[#737373]">
            Loading transactions...
          </div>
        ) : data?.items.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#737373]">
            No transactions match your search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-medium uppercase tracking-wider text-[#737373]">
                  <th className="py-3 px-4">Transaction Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {data?.items.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#FAFAFA] transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#171717]">{tx.name}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-[#A3A3A3] truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#737373]">
                      <span className="rounded bg-[#F4F4F4] px-2 py-0.5 text-[11px] border border-[#EAEAEA]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#737373] whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="py-3 px-4 text-[#737373] font-mono text-[11px]">
                      {tx.payment_method}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-medium whitespace-nowrap ${
                        tx.type === "income" ? "text-emerald-700" : "text-[#171717]"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTx(tx)}
                          className="rounded p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F4]"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="rounded p-1 text-[#737373] hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-[#EAEAEA] px-4 py-3 text-xs text-[#737373]">
            <span>
              Page {data.page} of {data.total_pages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-white px-2.5 py-1 text-xs hover:bg-[#F4F4F4] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={data.page >= data.total_pages}
                className="flex items-center gap-1 rounded-md border border-[#EAEAEA] bg-white px-2.5 py-1 text-xs hover:bg-[#F4F4F4] disabled:opacity-40 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            <h4 className="text-sm font-semibold text-[#171717]">
              Delete Transaction?
            </h4>
            <p className="mt-1 text-xs text-[#737373]">
              This action cannot be undone. All budget calculations will automatically update.
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
                disabled={deleteLoading}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

