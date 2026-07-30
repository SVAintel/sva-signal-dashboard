"use client";

import { useMemo, useState } from "react";
import { Event } from "@/lib/types";

type VerificationFilter = "all" | "confirmed" | "unconfirmed";

// Telegram is scraped OSINT/war-monitor chatter, not a vetted news source —
// treat it as "unconfirmed". Every other source (wire APIs, RSS outlets,
// ACLED, GDELT, USGS/EMSC, etc.) is treated as "confirmed".
function isUnconfirmed(source: string): boolean {
  return source.startsWith("Telegram");
}

const categoryMeta: Record<string, { label: string; color: string; bg: string }> = {
  war:               { label: "WAR",     color: "#ef4444", bg: "#1a0a0a" },
  counter_terrorism: { label: "C-TER",   color: "#a855f7", bg: "#130a1a" },
  natural_disaster:  { label: "GEO",     color: "#f59e0b", bg: "#1a120a" },
  market:            { label: "MARKET",  color: "#22d3ee", bg: "#0a141a" },
  biological:        { label: "BIO",     color: "#22c55e", bg: "#0a1a0f" },
  political_unrest:  { label: "POL",     color: "#f97316", bg: "#1a0f0a" },
  cyber:             { label: "CYB",     color: "#06b6d4", bg: "#0a1419" },
  nuclear:           { label: "NUC",     color: "#84cc16", bg: "#111a0a" },
  energy:            { label: "NRG",     color: "#d97706", bg: "#1a1200" },
  humanitarian:      { label: "HUM",     color: "#f43f5e", bg: "#1a0a0e" },
};

const confidenceDot: Record<string, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

export default function EventList({
  events,
  loading,
  onSelectEvent,
  selectedEvent,
}: {
  events: Event[];
  loading: boolean;
  onSelectEvent: (event: Event | null) => void;
  selectedEvent: Event | null;
}) {
  const [verification, setVerification] = useState<VerificationFilter>("all");

  const filteredEvents = useMemo(() => {
    if (verification === "all") return events;
    return events.filter((e) =>
      verification === "unconfirmed" ? isUnconfirmed(e.source) : !isUnconfirmed(e.source)
    );
  }, [events, verification]);

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded border border-[#3a3a3a] bg-[#111111]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sidebar header */}
      <div className="border-b border-[#3a3a3a] px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Signal Feed
          </div>
          <div className="flex items-center gap-1">
            {(["all", "confirmed", "unconfirmed"] as VerificationFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setVerification(v)}
                className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest transition ${
                  verification === v
                    ? "border-[#d4b36a] bg-[#1e1e1e] text-[#d4b36a]"
                    : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event list */}
      <div>
        {filteredEvents.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-600 uppercase tracking-widest">
            No signals detected
          </div>
        )}
        {filteredEvents.map((event) => {
          const meta = categoryMeta[event.category] || categoryMeta.war;
          const isSelected = selectedEvent?.id === event.id;
          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              style={isSelected ? { borderLeftColor: meta.color } : {}}
              className={`w-full border-b border-[#3a3a3a] border-l-2 p-3 text-left transition ${
                isSelected
                  ? "bg-[#1e1e1e]"
                  : "border-l-transparent hover:bg-[#111111]"
              }`}
            >
              {/* Category + confidence */}
              <div className="mb-1 flex items-center justify-between">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <div className="flex items-center gap-1">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: confidenceDot[event.confidence] || "#64748b" }}
                  />
                  <span className="text-[9px] uppercase tracking-wider text-slate-600">
                    {event.confidence}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-[12px] font-semibold leading-tight text-slate-200">
                {event.title}
              </div>

              {/* Source + timestamp */}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">{event.source}</span>
                <span className="text-[9px] text-slate-700">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}

