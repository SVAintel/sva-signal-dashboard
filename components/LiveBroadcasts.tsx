"use client";

import { useEffect, useState } from "react";

interface Channel {
  name: string;
  region: string;
  channelId: string;
  videoId: string | null;
}

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
}

const CHANNEL_COLORS: Record<string, string> = {
  "Al Jazeera": "#22d3ee",
  "DW News":    "#a855f7",
  "France 24":  "#22d3ee",
  "Sky News":   "#3b82f6",
  "WION":       "#f59e0b",
  "NewsNation": "#ef4444",
  "Fox News":   "#ef4444",
  "CNN":        "#dc2626",
};

const QUICK_SEARCHES = ["Israel", "Gaza", "Ukraine", "Iran", "Taiwan", "Sudan"];

interface LiveBroadcastsProps {
  // Explicit pixel height for the video area. When omitted, falls back to a
  // 16:9 aspect ratio. Passed in by Dashboard when the panel is user-resizable.
  videoHeight?: number;
}

export default function LiveBroadcasts({ videoHeight }: LiveBroadcastsProps) {
  const [mode, setMode] = useState<"curated" | "search">("curated");

  // Curated mode state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search mode state
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchActive, setSearchActive] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  function runSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setSearchLoading(true);
    setSearchError(null);
    fetch(`/api/live-streams?mode=search&q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results || []);
        setSearchActive(0);
        setSearchLoading(false);
        if ((data.results || []).length === 0 && data.error) {
          setSearchError(data.error);
        }
      })
      .catch(() => {
        setSearchError("Search failed");
        setSearchLoading(false);
      });
  }

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
  const currentResult = results[searchActive];

  return (
    <div className="flex flex-col border-t border-[#3a3a3a]">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 border-b border-[#3a3a3a] px-4 pt-2">
        <button
          onClick={() => setMode("curated")}
          className={`rounded-t px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
            mode === "curated" ? "bg-[#1e1e1e] text-slate-200" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Curated
        </button>
        <button
          onClick={() => setMode("search")}
          className={`rounded-t px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
            mode === "search" ? "bg-[#1e1e1e] text-slate-200" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Search (Unverified)
        </button>
      </div>

      {mode === "curated" ? (
        <>
          {/* Channel selector */}
          <div className="border-b border-[#3a3a3a] px-4 py-2">
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
                        ? "bg-[#1e1e1e]"
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

          {/* Embed — use direct videoId if found, else channel live_stream fallback */}
          <div className="w-full bg-black" style={videoHeight ? { height: videoHeight } : { aspectRatio: "16/9" }}>
            {current && (
              <iframe
                key={current.videoId ?? current.channelId}
                src={
                  current.videoId
                    ? `https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`
                    : `https://www.youtube.com/embed/live_stream?channel=${current.channelId}&autoplay=1&mute=1&modestbranding=1&rel=0`
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
                title={`${current.name} Live`}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#3a3a3a] px-4 py-1 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Live</span>
            <span className="text-[9px] text-slate-600">•</span>
            <span className="text-[9px] text-slate-500">{current?.name}</span>
          </div>
        </>
      ) : (
        <>
          {/* Search controls */}
          <div className="border-b border-[#3a3a3a] px-4 py-2 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Search Live Feeds
            </div>
            <div className="flex flex-wrap gap-1">
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  onClick={() => runSearch(q)}
                  className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition ${
                    query === q
                      ? "border-red-400 bg-[#1e1e1e] text-red-400"
                      : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(searchInput);
              }}
              className="flex gap-1"
            >
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Custom search…"
                className="flex-1 rounded border border-slate-700 bg-[#0d0d0d] px-2 py-1 text-[10px] text-slate-300 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded border border-slate-700 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:border-slate-500 hover:text-slate-200"
              >
                Go
              </button>
            </form>
            <p className="text-[8px] leading-tight text-amber-500/70">
              ⚠ Unverified: results are pulled from public YouTube search, not vetted news
              sources. Content may be unrelated, sensationalized, or unreliable.
            </p>
          </div>

          {searchLoading && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Searching…</p>
            </div>
          )}

          {searchError && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-xs text-slate-500">{searchError}</p>
            </div>
          )}

          {!searchLoading && !searchError && results.length === 0 && query && (
            <div className="flex h-40 items-center justify-center p-4 text-center">
              <p className="text-xs text-slate-500">No live streams found for "{query}"</p>
            </div>
          )}

          {!searchLoading && !searchError && results.length === 0 && !query && (
            <div className="flex h-40 items-center justify-center p-4 text-center">
              <p className="text-xs text-slate-500">Pick a region or search a keyword to find live streams</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="w-full bg-black" style={videoHeight ? { height: videoHeight } : { aspectRatio: "16/9" }}>
                {currentResult && (
                  <iframe
                    key={currentResult.videoId}
                    src={`https://www.youtube.com/embed/${currentResult.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                    title={currentResult.title}
                  />
                )}
              </div>
              <div className="border-t border-[#3a3a3a] px-4 py-2 max-h-32 overflow-y-auto space-y-1">
                {results.map((r, i) => (
                  <button
                    key={r.videoId}
                    onClick={() => setSearchActive(i)}
                    className={`block w-full rounded px-2 py-1 text-left text-[10px] transition ${
                      i === searchActive
                        ? "bg-[#1e1e1e] text-slate-200"
                        : "text-slate-500 hover:bg-[#111111] hover:text-slate-300"
                    }`}
                  >
                    <span className="mr-1 text-red-400">●</span>
                    {r.title}
                    <span className="ml-1 text-slate-600">— {r.channelTitle}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
