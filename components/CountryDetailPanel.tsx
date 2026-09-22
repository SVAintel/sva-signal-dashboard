"use client";

import { useEffect, useState } from "react";
import DetailFrame from "./DetailFrame";
import type { CountryDetail } from "@/lib/data/country-details";

export interface CountryData {
  name: string;
  details?: CountryDetail;
}

interface CountryDetailPanelProps {
  country: CountryData | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RegionBriefResponse {
  brief: string;
  eventCount: number;
  fleetMatchCount: number;
  windowDays: number;
}

export default function CountryDetailPanel({ country, onClose }: CountryDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [brief, setBrief] = useState<RegionBriefResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) {
      setChatMessages([]);
      return;
    }
    setChatMessages([
      {
        role: "assistant",
        content: "Ask me anything about this country — political situation, military posture, economy, or regional relationships.",
      },
    ]);
    setChatInput("");
    setChatError(null);
    setChatLoading(false);
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
  }, [country?.name]);

  const generateBrief = async () => {
    if (!country || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch(`/api/region-brief?region=${encodeURIComponent(country.name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Brief request failed");
      setBrief(data);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Brief request failed");
    } finally {
      setBriefLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!country) return;
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
          country,
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

  if (!country) return null;

  const details = country.details;

  return (
    <DetailFrame title={country.name} eyebrow={"Country profile / Reference"} onClose={onClose}>
        <div className="detail-content">
          <div className="detail-section">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-medium text-sky-400">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                7-Day Regional Brief
              </h2>
              <button
                onClick={generateBrief}
                disabled={briefLoading}
                className={`shrink-0 rounded border px-3 py-1.5 text-[11px] font-medium transition ${
                  briefLoading
                    ? "cursor-not-allowed border-slate-700 text-[color:var(--desk-muted)]"
                    : "border-sky-500 text-sky-400 hover:bg-sky-950/40"
                }`}
              >
                {briefLoading ? "Generating..." : brief ? "Regenerate" : "Generate"}
              </button>
            </div>

            {briefError && <p className="text-[11px] text-red-400">{briefError}</p>}

            {brief ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--desk-text)]">{brief.brief}</p>
                <p className="mt-3 text-[11px] text-[color:var(--desk-muted)]">
                  Synthesized from {brief.eventCount} tracked event{brief.eventCount === 1 ? "" : "s"}
                  {brief.fleetMatchCount > 0
                    ? ` and ${brief.fleetMatchCount} nearby fleet group${brief.fleetMatchCount === 1 ? "" : "s"}`
                    : ""}{" "}
                  captured over the last {brief.windowDays} days — analytical synthesis, not a primary source.
                </p>
              </>
            ) : (
              !briefLoading && (
                <p className="text-sm leading-relaxed text-slate-400">
                  Generate an AI-synthesized summary of this region's tracked events, military posture, and outlook
                  over the last 7 days.
                </p>
              )
            )}
          </div>

          <div className="detail-facts">
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Capital</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.capital || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">Population</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.population || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[color:var(--desk-muted)]">GDP</p>
              <p className="mt-1 text-sm text-[color:var(--desk-text)]">{details?.gdp || "N/A"}</p>
            </div>
          </div>

          {details ? (
            <>
              <div>
                <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Summary</h2>
                <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{details.summary}</p>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Government & Politics
                </h2>
                <ul className="space-y-2 text-sm text-[color:var(--desk-text)]">
                  <li>
                    <span className="text-[color:var(--desk-muted)]">Type: </span>
                    {details.governmentType}
                  </li>
                  <li>
                    <span className="text-[color:var(--desk-muted)]">Ruling parties: </span>
                    {details.rulingParties}
                  </li>
                </ul>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Economy
                </h2>
                <p className="mb-2 text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-muted)]">Major exports: </span>
                  {details.majorExports.join(", ")}
                </p>
                <p className="text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-muted)]">Top trade partners: </span>
                  {details.topTradePartners.join(", ")}
                </p>
              </div>

              <div className="detail-section">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                  Military
                </h2>
                <ul className="mb-2 space-y-1">
                  {details.militaryBranches.map((branch, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                      <span className="text-[color:var(--desk-accent)]">▸</span>
                      <span>{branch}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-muted)]">Active personnel: </span>
                  {details.activePersonnel}
                </p>
                <p className="text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-muted)]">Defense budget: </span>
                  {details.defenseBudget}
                </p>
                <p className="mt-2 text-sm text-[color:var(--desk-text)]">
                  <span className="text-[color:var(--desk-muted)]">Alliances / partners: </span>
                  {details.alliances.join(", ")}
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-[color:var(--desk-muted)]">
                Figures are approximate, drawn from general public/unclassified sources — not an authoritative or
                classified intelligence dataset.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-slate-400">
              Detailed political, economic, and military data is not yet curated for this country — currently
              covering Europe. Broader coverage can be added on request.
            </p>
          )}

          <div className="detail-section">
            <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Country AI Q&A</h2>

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
                placeholder="Ask about this country..."
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
