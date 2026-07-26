"use client";

import { useState } from "react";

const CHANNELS = [
  {
    name: "Al Jazeera",
    id: "F9I0rGEmCpE",
    region: "GLOBAL",
    color: "#22d3ee",
  },
  {
    name: "DW News",
    id: "GBnpRxA1qCs",
    region: "EUROPE",
    color: "#a855f7",
  },
  {
    name: "France 24",
    id: "h3MuIUNCCLI",
    region: "EUROPE",
    color: "#22d3ee",
  },
  {
    name: "Sky News",
    id: "9Auq9mYxFEE",
    region: "UK",
    color: "#3b82f6",
  },
  {
    name: "WION",
    id: "rwDInbGBTxk",
    region: "ASIA",
    color: "#f59e0b",
  },
  {
    name: "NewsNation",
    id: "Dj6-ZuXQT8k",
    region: "US",
    color: "#ef4444",
  },
];

export default function LiveBroadcasts() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex h-full flex-col">
      {/* Channel selector */}
      <div className="border-b border-[#1e3a5f] px-4 py-2">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Live Broadcasts
        </div>
        <div className="flex flex-wrap gap-1">
          {CHANNELS.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => setActive(i)}
              style={active === i ? { borderColor: ch.color, color: ch.color } : {}}
              className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition ${
                active === i
                  ? "bg-[#0f172a]"
                  : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {ch.name}
              <span className="ml-1 text-[8px] opacity-50">{ch.region}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Embed */}
      <div className="flex-1 bg-black">
        <iframe
          key={CHANNELS[active].id}
          src={`https://www.youtube.com/embed/${CHANNELS[active].id}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
          title={`${CHANNELS[active].name} Live`}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e3a5f] px-4 py-1 flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Live</span>
        <span className="text-[9px] text-slate-600">•</span>
        <span className="text-[9px] text-slate-500">{CHANNELS[active].name}</span>
      </div>
    </div>
  );
}
