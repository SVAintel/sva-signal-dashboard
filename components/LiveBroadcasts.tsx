"use client";

import { useEffect, useState } from "react";

interface Channel {
  name: string;
  region: string;
  channelId: string;
  videoId: string | null;
}

const CHANNEL_COLORS: Record<string, string> = {
  "Al Jazeera": "#22d3ee",
  "DW News":    "#a855f7",
  "France 24":  "#22d3ee",
  "Sky News":   "#3b82f6",
  "WION":       "#f59e0b",
  "NewsNation": "#ef4444",
};

export default function LiveBroadcasts() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/live-streams")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data);
        // Default to first channel that has a live stream
        const firstLive = data.findIndex((c: Channel) => c.videoId);
        setActive(firstLive >= 0 ? firstLive : 0);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load live streams");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 mx-auto" />
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Scanning live feeds…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  const current = channels[active];

  return (
    <div className="flex h-full flex-col">
      {/* Channel selector */}
      <div className="border-b border-[#1e3a5f] px-4 py-2">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Live Broadcasts
        </div>
        <div className="flex flex-wrap gap-1">
          {channels.map((ch, i) => {
            const color = CHANNEL_COLORS[ch.name] || "#64748b";
            const isLive = !!ch.videoId;
            return (
              <button
                key={ch.channelId}
                onClick={() => setActive(i)}
                style={active === i ? { borderColor: color, color } : {}}
                className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition ${
                  active === i
                    ? "bg-[#0f172a]"
                    : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                } ${!isLive ? "opacity-40" : ""}`}
              >
                {isLive && <span className="mr-1 text-red-400">●</span>}
                {ch.name}
                <span className="ml-1 text-[8px] opacity-50">{ch.region}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embed or unavailable */}
      <div className="flex-1 bg-black">
        {current?.videoId ? (
          <iframe
            key={current.videoId}
            src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
            title={`${current.name} Live`}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[11px] text-slate-600 uppercase tracking-widest">No live stream found for {current?.name}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e3a5f] px-4 py-1 flex items-center gap-2">
        {current?.videoId ? (
          <>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Live</span>
            <span className="text-[9px] text-slate-600">•</span>
            <span className="text-[9px] text-slate-500">{current?.name}</span>
          </>
        ) : (
          <span className="text-[9px] text-slate-600 uppercase tracking-widest">Stream unavailable</span>
        )}
      </div>
    </div>
  );
}
