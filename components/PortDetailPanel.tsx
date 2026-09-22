"use client";

import { useEffect, useState } from "react";
import DetailFrame from "./DetailFrame";
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
    <DetailFrame title={port.displayName} eyebrow={"Seaport / " + port.size} onClose={onClose}>
        <div className="detail-content">
          <div className="detail-facts">
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Country</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{port.country || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Harbor Size</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{port.size}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Chokepoint</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.chokepoint || "None"}</p>
            </div>
          </div>

          {details ? (
            <>
              <div>
                <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Summary</h2>
                <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{details.strategicNotes}</p>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Primary Cargo
                </h2>
                <ul className="space-y-2">
                  {details.primaryCargo.map((cargo, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                      <span className="text-[color:var(--desk-accent)]">▸</span>
                      <span>{cargo}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Throughput
                </h2>
                <p className="text-sm text-[color:var(--desk-text)]">{details.annualThroughput}</p>
              </div>

              <p className="text-[11px] leading-relaxed text-[color:var(--desk-muted)]">
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

          <div className="detail-section">
            <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Port AI Q&A</h2>

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
                placeholder="Ask about this port..."
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
