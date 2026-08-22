"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PortDetail } from "@/lib/data/port-details";

export interface PortData {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country: string;
  size: string;
  isMajor: boolean;
  details?: PortDetail;
}

interface PortDetailPanelProps {
  port: PortData | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PortDetailPanel({ port, onClose }: PortDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!port) {
      setChatMessages([]);
      return;
    }
    setChatMessages([
      {
        role: "assistant",
        content: "Ask me anything about this port — throughput, cargo mix, chokepoint exposure, or what to monitor next.",
      },
    ]);
    setChatInput("");
    setChatError(null);
    setChatLoading(false);
  }, [port?.name]);

  const sendChatMessage = async () => {
    if (!port) return;
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: trimmed }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port,
          messages: nextMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response." }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      setChatError(message);
    } finally {
      setChatLoading(false);
    }
  };

  if (!port) return null;

  const details = port.details;
  const color = port.isMajor ? "#d4b36a" : "#93c5fd";

  return (
    <div className="absolute inset-y-0 right-0 z-[1200] flex w-full max-w-full sm:max-w-[420px] pointer-events-none">
      <div className="pointer-events-auto flex h-full w-full flex-col overflow-y-auto border-l border-[#d4b36a]/30 bg-[#0e0e0ef5] shadow-2xl backdrop-blur-sm">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d4b36a]/30 bg-[#0f0f0f] px-5 py-4">
          <div className="flex-1 pr-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-xs font-bold uppercase text-[#d4b36a]">
                Seaport{port.size !== "Unknown" ? ` • ${port.size}` : ""}{port.isMajor ? " • Major" : ""}
              </span>
            </div>
            <h1 className="text-lg font-bold leading-snug text-slate-100">⚓ {port.displayName}</h1>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-slate-400 transition hover:bg-[#262626] hover:text-[#d4b36a]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-3 border-b border-[#3a3a3a] pb-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Country</p>
              <p className="mt-1 text-sm text-slate-200">{port.country || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Harbor Size</p>
              <p className="mt-1 text-sm text-slate-200">{port.size}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Chokepoint</p>
              <p className="mt-1 text-sm text-slate-200">{details?.chokepoint || "None"}</p>
            </div>
          </div>

          {details ? (
            <>
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Summary</h2>
                <p className="text-sm leading-relaxed text-slate-300">{details.strategicNotes}</p>
              </div>

              <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Primary Cargo
                </h2>
                <ul className="space-y-2">
                  {details.primaryCargo.map((cargo, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-[#d4b36a]">▸</span>
                      <span>{cargo}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Throughput
                </h2>
                <p className="text-sm text-slate-300">{details.annualThroughput}</p>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-600">
                Figures are approximate, drawn from general public/unclassified sources — not an authoritative
                maritime traffic dataset.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-slate-400">
              Limited public data available for this port beyond name, location, and harbor size. Detailed cargo,
              throughput, and chokepoint data is currently only curated for a subset of major, strategically
              significant ports.
            </p>
          )}

          <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
            <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Port AI Q&A</h2>

            <div className="max-h-72 space-y-3 overflow-y-auto rounded border border-[#3a3a3a] bg-[#0f0f0f] p-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`text-xs ${msg.role === "assistant" ? "text-slate-300" : "text-[#e2c98b]"}`}>
                  <span className="mb-1 block font-bold uppercase tracking-widest text-[10px]">
                    {msg.role === "assistant" ? "AI" : "You"}
                  </span>
                  <div className="space-y-2 leading-relaxed">
                    {msg.content
                      .split(/\n\s*\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((para, pIdx) => (
                        <p key={pIdx} className="whitespace-pre-wrap">
                          {para}
                        </p>
                      ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="text-xs text-slate-500">
                  <span className="mr-2 font-bold uppercase tracking-widest text-[10px]">AI</span>
                  Thinking...
                </div>
              )}
            </div>

            {chatError && <p className="mt-2 text-[11px] text-red-400">{chatError}</p>}

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this port..."
                className="flex-1 rounded border border-[#3a3a3a] bg-[#0c0c0c] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#d4b36a] focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className={`rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition ${
                  chatLoading || !chatInput.trim()
                    ? "cursor-not-allowed border-slate-700 text-slate-600"
                    : "border-[#d4b36a] text-[#d4b36a] hover:bg-[#2a2a2a]"
                }`}
              >
                {chatLoading ? "Thinking..." : "Ask"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
