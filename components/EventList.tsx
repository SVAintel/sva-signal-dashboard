"use client";

import { Event } from "@/lib/types";

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
  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded border border-[#3a1d24] bg-[#140b0f]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sidebar header */}
      <div className="border-b border-[#3a1d24] px-4 py-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Signal Feed
        </div>
      </div>

      {/* Event list */}
      <div>
        {events.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-600 uppercase tracking-widest">
            No signals detected
          </div>
        )}
        {events.map((event) => {
          const meta = categoryMeta[event.category] || categoryMeta.war;
          const isSelected = selectedEvent?.id === event.id;
          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              style={isSelected ? { borderLeftColor: meta.color } : {}}
              className={`w-full border-b border-[#3a1d24] border-l-2 p-3 text-left transition ${
                isSelected
                  ? "bg-[#1a0f12]"
                  : "border-l-transparent hover:bg-[#140b0f]"
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
                  {new Date(event.timestamp).toISOString().slice(11, 16)}Z
                </span>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
