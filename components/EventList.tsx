"use client";

import { Event } from "@/lib/types";

const categoryMeta: Record<string, { label: string; color: string; bg: string }> = {
  war:               { label: "WAR",     color: "#ef4444", bg: "#1a0a0a" },
  counter_terrorism: { label: "C-TER",   color: "#a855f7", bg: "#130a1a" },
  natural_disaster:  { label: "GEO",     color: "#f59e0b", bg: "#1a120a" },
  market:            { label: "MARKET",  color: "#22d3ee", bg: "#0a141a" },
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
            <div key={i} className="h-14 animate-pulse rounded border border-[#1e3a5f] bg-[#0a1020]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sidebar header */}
      <div className="border-b border-[#1e3a5f] px-4 py-2">
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
              className={`w-full border-b border-[#1e3a5f] border-l-2 p-3 text-left transition ${
                isSelected
                  ? "bg-[#0d1625]"
                  : "border-l-transparent hover:bg-[#0a1020]"
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
