"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ConflictZoneData {
  id: string;
  name: string;
  countries: string[];
  actors: string[];
  description: string;
  casualties: string;
  startYear: number;
  intensity: "high" | "medium" | "low";
  sources: string[];
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}

interface ConflictZoneDetailPanelProps {
  zone: ConflictZoneData | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const intensityColor: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#84cc16",
};

export default function ConflictZoneDetailPanel({ zone, onClose }: ConflictZoneDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!zone) {
      setChatMessages([]);
      return;
    }
    setChatMessages([
      {
        role: "assistant",
        content: "Ask me anything about this conflict zone — actors, trajectory, casualties, or what to monitor next.",
      },
    ]);
    setChatInput("");
    setChatError(null);
    setChatLoading(false);
  }, [zone?.id]);

  const sendChatMessage = async () => {
    if (!zone) return;
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
          conflictZone: zone,
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

  if (!zone) return null;

  const color = intensityColor[zone.intensity] || "#d4b36a";

  return (
    <div className="absolute inset-y-0 right-0 z-[1200] flex w-full max-w-full sm:max-w-[420px] pointer-events-none">
      <div className="pointer-events-auto flex h-full w-full flex-col overflow-y-auto border-l border-[#d4b36a]/30 bg-[#0e0e0ef5] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d4b36a]/30 bg-[#0f0f0f] px-5 py-4">
          <div className="flex-1 pr-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-xs font-bold uppercase text-[#d4b36a]">
                Conflict Zone • {zone.intensity} intensity
              </span>
            </div>
            <h1 className="text-lg font-bold leading-snug text-slate-100">{zone.name}</h1>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-slate-400 transition hover:bg-[#262626] hover:text-[#d4b36a]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-3 border-b border-[#3a3a3a] pb-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Country / Region</p>
              <p className="mt-1 text-sm text-slate-200">{zone.countries.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Active Since</p>
              <p className="mt-1 text-sm text-slate-200">{zone.startYear}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Estimated Casualties</p>
              <p className="mt-1 text-sm text-slate-200">{zone.casualties}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Summary</h2>
            <p className="text-sm leading-relaxed text-slate-300">{zone.description}</p>
          </div>

          <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
              <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
              Who's Involved
            </h2>
            <ul className="space-y-2">
              {zone.actors.map((actor, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-[#d4b36a]">▸</span>
                  <span>{actor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold uppercase text-[#d4b36a]">Sources & References</h2>
            <div className="flex flex-wrap gap-2">
              {zone.sources.map((source, idx) => (
                <span key={idx} className="rounded border border-[#3a3a3a] bg-[#111111] px-2 py-1 text-xs text-slate-400">
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
            <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Conflict Zone AI Q&A</h2>

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
                placeholder="Ask about this conflict zone..."
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
