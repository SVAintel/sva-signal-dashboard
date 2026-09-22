"use client";

import { useEffect, useState } from "react";
import DetailFrame from "./DetailFrame";

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
    <DetailFrame title={zone.name} eyebrow={"Conflict zone / " + zone.intensity + " intensity"} onClose={onClose}>
        <div className="detail-content">
          <div className="detail-facts">
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Country / Region</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{zone.countries.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Active Since</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{zone.startYear}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Estimated Casualties</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{zone.casualties}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Summary</h2>
            <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{zone.description}</p>
          </div>

          <div className="detail-section">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
              <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
              Who's Involved
            </h2>
            <ul className="space-y-2">
              {zone.actors.map((actor, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-accent)]">▸</span>
                  <span>{actor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-[color:var(--desk-accent)]">Sources & References</h2>
            <div className="flex flex-wrap gap-2">
              {zone.sources.map((source, idx) => (
                <span key={idx} className="rounded border border-[var(--desk-line)] bg-[#111111] px-2 py-1 text-xs text-slate-400">
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Conflict Zone AI Q&A</h2>

            <div className="detail-conversation">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`text-xs ${msg.role === "assistant" ? "text-[color:var(--desk-text)]" : "text-[#e2c98b]"}`}>
                  <span className="mb-1 block font-medium text-[11px]">
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
                <div className="text-xs text-[color:var(--desk-muted)]">
                  <span className="mr-2 font-medium text-[11px]">AI</span>
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
                aria-label="Ask about this subject"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this conflict zone..."
                className="flex-1 rounded border border-[var(--desk-line)] bg-[var(--desk-raised)] px-3 py-2 text-xs text-[color:var(--desk-text)] placeholder:text-[color:var(--desk-muted)] focus:border-[#d4b36a] focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className={`rounded border px-3 py-2 text-[11px] font-medium transition ${
                  chatLoading || !chatInput.trim()
                    ? "cursor-not-allowed border-slate-700 text-[color:var(--desk-muted)]"
                    : "border-[#d4b36a] text-[color:var(--desk-accent)] hover:bg-[#2a2a2a]"
                }`}
              >
                {chatLoading ? "Thinking..." : "Ask"}
              </button>
            </form>
          </div>
        </div>
    </DetailFrame>
  );
}
