"use client";

import { Event } from "@/lib/types";

const categoryColors: Record<string, string> = {
  war: "bg-red-900 text-red-100",
  counter_terrorism: "bg-purple-900 text-purple-100",
  natural_disaster: "bg-amber-900 text-amber-100",
  market: "bg-blue-900 text-blue-100",
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
      <div className="rounded-lg bg-slate-800 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded bg-slate-700" />
          <div className="h-12 rounded bg-slate-700" />
          <div className="h-12 rounded bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Events</h2>
      <div className="max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto rounded-lg bg-slate-800 p-3">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className={`w-full rounded-lg p-3 text-left transition ${
              selectedEvent?.id === event.id
                ? "bg-slate-600 ring-2 ring-blue-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold text-white">{event.title}</div>
                <div className="text-xs text-slate-400">{event.source}</div>
              </div>
              <span
                className={`whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${
                  categoryColors[event.category] || "bg-slate-600 text-slate-300"
                }`}
              >
                {event.category.replace(/_/g, " ")}
              </span>
            </div>
            {selectedEvent?.id === event.id && (
              <div className="mt-3 space-y-2 border-t border-slate-600 pt-3">
                <p className="text-sm text-slate-300">{event.description}</p>
                <div className="text-xs text-slate-400">
                  <div>
                    <strong>AI Analyst Notes:</strong> {event.aiNotes}
                  </div>
                  <div>
                    <strong>Confidence:</strong> {event.confidence}
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
