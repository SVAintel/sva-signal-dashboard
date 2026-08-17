"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { MilitaryBaseDetail } from "@/lib/data/military-base-details";

export interface MilitaryBaseData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  operator: string | null;
  isMajor: boolean;
  details?: MilitaryBaseDetail;
}

interface MilitaryBaseDetailPanelProps {
  base: MilitaryBaseData | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function MilitaryBaseDetailPanel({ base, onClose }: MilitaryBaseDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!base) {
      setChatMessages([]);
      return;
    }
    setChatMessages([
      {
        role: "assistant",
        content: "Ask me anything about this installation. I can explain its strategic role, likely activity, and what to monitor next.",
      },
    ]);
    setChatInput("");
    setChatError(null);
    setChatLoading(false);
  }, [base?.id]);

  const sendChatMessage = async () => {
    if (!base) return;
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
          militaryBase: base,
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

  if (!base) return null;

  const color = base.isMajor ? "#d4b36a" : "#6b7d3d";
  const details = base.details;

  return (
    <div className="absolute inset-y-0 right-0 z-[1200] flex w-full max-w-full sm:max-w-[420px] pointer-events-none">
      <div className="pointer-events-auto flex h-full w-full flex-col overflow-y-auto border-l border-[#d4b36a]/30 bg-[#0e0e0ef5] shadow-2xl backdrop-blur-sm">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d4b36a]/30 bg-[#0f0f0f] px-5 py-4">
          <div className="flex-1 pr-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-xs font-bold uppercase text-[#d4b36a]">
                Military Installation{base.isMajor ? " • Major Base" : ""}
              </span>
            </div>
            <h1 className="text-lg font-bold leading-snug text-slate-100">🎯 {base.name}</h1>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-slate-400 transition hover:bg-[#262626] hover:text-[#d4b36a]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-3 border-b border-[#3a3a3a] pb-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Branch</p>
              <p className="mt-1 text-sm text-slate-200">{details?.branch || base.operator || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Country / Region</p>
              <p className="mt-1 text-sm text-slate-200">{base.country || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Est. Population</p>
              <p className="mt-1 text-sm text-slate-200">{details?.population || "Not publicly available"}</p>
            </div>
          </div>

          {details ? (
            <>
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Summary</h2>
                <p className="text-sm leading-relaxed text-slate-300">{details.description}</p>
              </div>

              <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Major Units
                </h2>
                <ul className="space-y-2">
                  {details.majorUnits.map((unit, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-[#d4b36a]">▸</span>
                      <span>{unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Mission Set
                </h2>
                <ul className="space-y-2">
                  {details.missions.map((mission, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-[#d4b36a]">▸</span>
                      <span>{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-600">
                Figures are approximate, drawn from general public/unclassified sources — not an authoritative or
                classified order-of-battle dataset.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-slate-400">
              Limited public data available for this installation beyond name and location. Detailed unit,
              population, and mission data is currently only curated for a subset of major, well-known bases.
            </p>
          )}

          <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
            <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Installation AI Q&A</h2>

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
                placeholder="Ask about this installation..."
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
