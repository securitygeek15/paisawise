"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: "user" | "assistant";
  text: string;
}

const STARTER_PROMPTS = [
  "Where did most of my money go this month?",
  "Summarize my monthly finances",
  "Am I over budget on any category?",
  "What is my savings progress?",
];

export function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Hello! I'm your PaisaWise Local Assistant. I run 100% on your machine with zero cloud dependencies or data sharing. Ask me anything about your recorded spending, budgets, and savings goals.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [engineInfo, setEngineInfo] = useState<string>("Built-in Local Engine");

  React.useEffect(() => {
    if (isOpen) {
      apiRequest<{ name: string }>("/api/assistant/engine-status")
        .then((res) => setEngineInfo(res.name))
        .catch(() => setEngineInfo("Built-in Local Engine"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg = queryText.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await apiRequest<{ reply: string }>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ query: userMsg }),
      });
      setMessages((prev) => [...prev, { sender: "assistant", text: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I was unable to retrieve your financial data right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-2xl flex flex-col h-[520px] max-h-[85vh] animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171717] text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#171717]">
                  PaisaWise Assistant
                </h3>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#EAEAEA] bg-[#FAFAFA] text-[#737373]">
                  {engineInfo}
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">
                100% On-Device • Zero Cloud Data Sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#737373] hover:bg-[#F4F4F4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.sender === "assistant" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#F4F4F4] border border-[#EAEAEA] text-[#171717]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`rounded-lg px-3.5 py-2 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  m.sender === "user"
                    ? "bg-[#171717] text-white"
                    : "bg-[#FAFAFA] border border-[#EAEAEA] text-[#171717]"
                }`}
              >
                {m.text}
              </div>
              {m.sender === "user" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#171717] text-white text-[10px]">
                  You
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#737373] italic py-1">
              <Bot className="h-4 w-4 animate-spin text-[#171717]" />
              <span>Analyzing your financial records...</span>
            </div>
          )}
        </div>

        {/* Starter Chips */}
        <div className="pt-2 border-t border-[#EAEAEA]">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="text-[11px] rounded-full border border-[#EAEAEA] bg-[#FAFAFA] px-2.5 py-1 text-[#737373] hover:text-[#171717] hover:border-[#171717] transition-all disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your money..."
              disabled={loading}
              className="flex-1 rounded-md border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-xs text-[#171717] placeholder:text-[#A3A3A3] focus:border-[#171717] focus:bg-white focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex items-center justify-center rounded-md bg-[#171717] px-3.5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

