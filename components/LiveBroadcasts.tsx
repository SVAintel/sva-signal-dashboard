"use client";

import { useEffect, useRef, useState } from "react";

interface Channel {
  name: string;
  region: string;
  channelId: string;
  videoId: string | null;
  directEmbedUrl?: string | null;
  hlsUrl?: string | null;
}

// Minimal shape reported up to Dashboard so the mobile-only PiP mini player
// can mirror whichever curated channel is currently playing, without lifting
// all of LiveBroadcasts' internal state (search mode, "More" dropdown, etc.).
export type ActiveLiveChannel = Pick<Channel, "name" | "videoId" | "directEmbedUrl" | "hlsUrl">;

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
}

const QUICK_SEARCHES = ["Israel", "Gaza", "Ukraine", "Iran", "Taiwan", "Sudan"];

// Renders a raw HLS (.m3u8) stream via hls.js (native <video> HLS support is
// Safari-only, so we need hls.js for Chrome/Firefox/Edge). Reattaches
// whenever `src` changes (i.e. switching channels). Exported so the
// mobile-only Picture-in-Picture mini player in Dashboard can reuse the same
// HLS playback logic without duplicating it.
export function HlsVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari has native HLS support — no hls.js needed.
      video.src = src;
      video.play().catch(() => {});
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
        }
      });
    }

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full"
      controls
      autoPlay
      muted
      playsInline
      title={title}
    />
  );
}

interface LiveBroadcastsProps {
  // Collapse state is owned by the parent (Dashboard); the toggle button
  // lives here on the Curated/Search row per user request. There's no
  // resize-height prop anymore — the video area is always a fixed 16:9 box.
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  // Optional — reports the currently-playing curated channel (or null when
  // in search mode / nothing playing yet) up to Dashboard, purely so the
  // mobile-only Picture-in-Picture mini player can mirror it. Desktop and
  // the full sidebar player are unaffected by this.
  onActiveChannelChange?: (channel: ActiveLiveChannel | null) => void;
}

export default function LiveBroadcasts({ collapsed, onToggleCollapsed, onActiveChannelChange }: LiveBroadcastsProps) {
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

  // "More" channels dropdown (custom-built, not a native <select> — native
  // option lists ignore most CSS like font-size/weight/uppercase, so they
  // couldn't be made to match the rest of the UI).
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  useEffect(() => {
    fetch("/api/live-streams")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data);
        // Default to first channel that has a live stream
        const firstLive = data.findIndex((c: Channel) => c.videoId || c.directEmbedUrl || c.hlsUrl);
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

  const current = channels[active];

  // Report the currently-playing curated channel up to Dashboard (mobile-only
  // Picture-in-Picture mini player). Only fires in curated mode — search
  // results are unverified and intentionally excluded from PiP.
  useEffect(() => {
    if (!onActiveChannelChange) return;
    if (mode === "curated" && current) {
      onActiveChannelChange({
        name: current.name,
        videoId: current.videoId,
        directEmbedUrl: current.directEmbedUrl,
        hlsUrl: current.hlsUrl,
      });
    } else {
      onActiveChannelChange(null);
    }
  }, [mode, current, onActiveChannelChange]);

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

  const currentResult = results[searchActive];

  return (
    <div className="flex flex-col border-t border-[#3a3a3a]">
      {/* Mode toggle — collapse control sits on this same row, at the box edge */}
      <div className="flex items-center justify-between gap-1 border-b border-[#3a3a3a] px-4">
        <div className="flex items-center gap-1">
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
        <button
          onClick={onToggleCollapsed}
          className="px-2 py-1 text-slate-500 transition hover:text-[#d4b36a]"
          title={collapsed ? "Expand live streams" : "Collapse live streams"}
        >
          <span className={`inline-block text-2xl leading-none transition-transform ${collapsed ? "-rotate-90" : ""}`}>▾</span>
        </button>
      </div>

      {!collapsed && (mode === "curated" ? (
        <>
          {/* Channel selector — first 3 channels as quick-pick buttons (like
              before), remaining channels tucked into a "More" dropdown so
              the row doesn't wrap/eat vertical space as more channels are
              added. */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#3a3a3a] px-4 py-2">
            {channels.length > 3 && (
              <div className="relative flex shrink-0" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest transition ${
                    active >= 3
                      ? "border-[#d4b36a] bg-[#1e1e1e] text-[#d4b36a]"
                      : "border-slate-700 bg-[#0d0d0d] text-slate-500 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {active >= 3 ? channels[active].name : "More"}
                  <span className="ml-1 inline-block origin-center -translate-y-[2px] scale-150 align-middle leading-none">
                    {moreOpen ? "▴" : "▾"}
                  </span>
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 flex flex-col items-stretch gap-1 whitespace-nowrap rounded border border-[#3a3a3a] bg-[#0d0d0d] p-1 shadow-lg">
                    {channels.slice(3).map((ch, i) => {
                      const idx = i + 3;
                      const isLive = !!(ch.videoId || ch.directEmbedUrl || ch.hlsUrl);
                      return (
                        <button
                          key={ch.name}
                          onClick={() => {
                            setActive(idx);
                            setMoreOpen(false);
                          }}
                          className={`rounded border px-2 py-0.5 text-left text-[9px] font-bold uppercase tracking-widest transition ${
                            active === idx
                              ? "border-[#d4b36a] bg-[#1e1e1e] text-[#d4b36a]"
                              : "border-slate-700 bg-[#0d0d0d] text-slate-500 hover:border-slate-500 hover:text-slate-300"
                          } ${!isLive ? "opacity-40" : ""}`}
                        >
                          {isLive && <span className="mr-1 text-red-400">●</span>}
                          {ch.name}
                          <span className="ml-1 text-[8px] opacity-50">{ch.region}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {channels.slice(0, 3).map((ch, i) => {
              const isLive = !!(ch.videoId || ch.directEmbedUrl || ch.hlsUrl);
              return (
                <button
                  key={ch.name}
                  onClick={() => setActive(i)}
                  className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest transition ${
                    active === i
                      ? "border-[#d4b36a] text-[#d4b36a] bg-[#1e1e1e]"
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

          {/* Embed — prefer a direct broadcaster embed/stream (e.g. Al
              Jazeera's own Brightcove player, France 24's public HLS feed)
              when available, since YouTube now rejects embedding several
              news channels' live streams outright ("Error 153" — embedding
              disabled by the channel, or stricter origin checks; outside our
              control to fix). Falls back to the YouTube embed when we have a
              detected videoId, or an offline state when neither is
              available. */}
          {/* Always size to a true 16:9 box (derived from the available
              width) instead of a fixed pixel height — a fixed height that
              doesn't match the video's native aspect ratio causes the
              YouTube/Brightcove player (and even our own HLS <video>) to
              letterbox with black bars above/below. `videoHeight` (from the
              resizable panel drag handle) now only caps how much of the box
              is visible via the scrollable wrapper in Dashboard, it no
              longer stretches the video itself. */}
          <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
            {current?.hlsUrl ? (
              <HlsVideo key={current.hlsUrl} src={current.hlsUrl} title={`${current.name} Live`} />
            ) : current?.directEmbedUrl ? (
              <iframe
                key={current.directEmbedUrl}
                src={current.directEmbedUrl}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
                title={`${current.name} Live`}
              />
            ) : current && current.videoId ? (
              <iframe
                key={current.videoId}
                src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
                title={`${current.name} Live`}
              />
            ) : current ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  {current.name} isn&apos;t live right now
                </p>
                <a
                  href={`https://www.youtube.com/channel/${current.channelId}/live`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] uppercase tracking-widest text-[#d4b36a] hover:underline"
                >
                  Check channel on YouTube
                </a>
              </div>
            ) : null}
          </div>

          {/* Footer — includes a safety-net "watch elsewhere" link so a
              broken/rejected embed never fully strands the user. */}
          <div className="border-t border-[#3a3a3a] px-4 py-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Live</span>
              <span className="text-[9px] text-slate-600">•</span>
              <span className="text-[9px] text-slate-500">{current?.name}</span>
            </div>
            {current && !current.directEmbedUrl && current.videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${current.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] uppercase tracking-widest text-slate-600 hover:text-[#d4b36a] hover:underline"
              >
                Watch on YouTube ↗
              </a>
            )}
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
              {/* Same fixed-16:9 fix as the curated video box above — avoids
                  letterboxing from a mismatched pixel height. */}
              <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
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
      ))}
    </div>
  );
}
