"use client";

import { useEffect, useState } from "react";
import DetailFrame from "./DetailFrame";
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
    <DetailFrame title={base.name} eyebrow={base.isMajor ? "Military installation / Major base" : "Military installation"} onClose={onClose}>
        <div className="detail-content">
          <div className="detail-facts">
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Branch</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.branch || base.operator || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Country / Region</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{base.country || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Est. Population</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.population || "Not publicly available"}</p>
            </div>
          </div>

          {details ? (
            <>
              <div>
                <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Summary</h2>
                <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{details.description}</p>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Major Units
                </h2>
                <ul className="space-y-2">
                  {details.majorUnits.map((unit, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                      <span className="text-[color:var(--desk-accent)]">▸</span>
                      <span>{unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Mission Set
                </h2>
                <ul className="space-y-2">
                  {details.missions.map((mission, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                      <span className="text-[color:var(--desk-accent)]">▸</span>
                      <span>{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] leading-relaxed text-[color:var(--desk-muted)]">
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

          <div className="detail-section">
            <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Installation AI Q&A</h2>

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
                placeholder="Ask about this installation..."
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
