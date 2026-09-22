"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Radio, Search } from "lucide-react";

interface Channel {
  name: string; region: string; channelId: string; videoId: string | null;
  directEmbedUrl?: string | null; hlsUrl?: string | null;
}
export type ActiveLiveChannel = Pick<Channel, "name" | "videoId" | "directEmbedUrl" | "hlsUrl">;
interface SearchResult { videoId: string; title: string; channelTitle: string; thumbnail: string | null; }
const QUICK_SEARCHES = ["Israel", "Gaza", "Ukraine", "Iran", "Taiwan", "Sudan"];

export function HlsVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    setError("");
    const play = () => video.play().catch(() => {
      if (!cancelled) setError("Autoplay is unavailable. Use the player's Play control.");
    });
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      play();
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { setError("This browser does not support this stream."); return; }
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, play);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError("The broadcaster's stream is unavailable. Try another channel.");
        });
      }).catch(() => { if (!cancelled) setError("The video player could not be loaded."); });
    }
    return () => { cancelled = true; hls?.destroy(); };
  }, [src]);
  return <div className="relative h-full w-full">
    <video ref={videoRef} className="h-full w-full" controls autoPlay muted playsInline title={title} onPlaying={() => setError("")} onError={() => setError("The stream could not be loaded. Try another channel.")} />
    {error && <p role="status" className="absolute inset-x-0 top-0 bg-black/90 p-3 text-xs leading-relaxed text-amber-200">{error}</p>}
  </div>;
}

interface LiveBroadcastsProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onActiveChannelChange?: (channel: ActiveLiveChannel | null) => void;
}

export default function LiveBroadcasts({ collapsed, onToggleCollapsed, onActiveChannelChange }: LiveBroadcastsProps) {
  const [mode, setMode] = useState<"curated" | "search">("curated");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchActive, setSearchActive] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequest = useRef(0);
  useEffect(() => {
    fetch("/api/live-streams")
      .then((response) => { if (!response.ok) throw new Error("Failed to load broadcast sources"); return response.json(); })
      .then((data: Channel[]) => {
        setChannels(data);
        const first = data.findIndex((channel) => channel.videoId || channel.directEmbedUrl || channel.hlsUrl);
        setActive(first >= 0 ? first : 0);
      })
      .catch(() => setError("Broadcast sources could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  async function runSearch(term: string) {
    if (!term.trim()) return;
    const request = ++searchRequest.current;
    setQuery(term);
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(`/api/live-streams?mode=search&q=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Broadcast search failed");
      if (request !== searchRequest.current) return;
      setResults(data.results || []);
      setSearchActive(0);
      if (!data.results?.length && data.error) setSearchError(data.error);
    } catch (err) {
      if (request === searchRequest.current) setSearchError(err instanceof Error ? err.message : "Broadcast search failed");
    } finally { if (request === searchRequest.current) setSearchLoading(false); }
  }
  const current = channels[active];
  const currentResult = results[searchActive];
  useEffect(() => {
    onActiveChannelChange?.(mode === "curated" && current ? {
      name: current.name, videoId: current.videoId, directEmbedUrl: current.directEmbedUrl, hlsUrl: current.hlsUrl,
    } : null);
  }, [mode, current, onActiveChannelChange]);

  return (
    <section className="broadcast-panel" aria-label="Live broadcasts">
      <div className="broadcast-heading">
        <strong><Radio size={15} />Live broadcasts</strong>
        {onToggleCollapsed && <button className="desk-icon-button" onClick={onToggleCollapsed} aria-expanded={!collapsed} aria-label={collapsed ? "Expand live broadcasts" : "Collapse live broadcasts"}>
          {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>}
      </div>
      {!collapsed && <>
        <div className="broadcast-options">
          <button aria-pressed={mode === "curated"} onClick={() => setMode("curated")}>News channels</button>
          <button aria-pressed={mode === "search"} onClick={() => setMode("search")}>Search YouTube</button>
        </div>
        {mode === "curated" ? <>
          {loading ? <p className="surface-muted px-4 pb-4" role="status">Loading broadcast sources...</p> : error ? <p className="surface-error px-4 pb-4" role="alert">{error}</p> : !channels.length ? <p className="surface-muted px-4 pb-4">No broadcast sources are available.</p> : <>
            <label className="broadcast-channel">Broadcast source
              <select aria-label="Broadcast source" value={active} onChange={(event) => setActive(Number(event.target.value))}>
                {channels.map((channel, index) => <option key={channel.name} value={index}>{channel.name} · {channel.region}{channel.videoId || channel.directEmbedUrl || channel.hlsUrl ? "" : " · Unavailable"}</option>)}
              </select>
            </label>
            <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
              {current?.hlsUrl ? <HlsVideo key={current.hlsUrl} src={current.hlsUrl} title={`${current.name} broadcast`} /> : current?.directEmbedUrl ? (
                <iframe key={current.directEmbedUrl} src={current.directEmbedUrl} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={`${current.name} broadcast`} />
              ) : current?.videoId ? (
                <iframe key={current.videoId} src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={`${current.name} broadcast`} />
              ) : current ? <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
                <p className="surface-muted">No embeddable stream is available for {current.name}.</p>
                <a href={`https://www.youtube.com/channel/${current.channelId}/live`} target="_blank" rel="noopener noreferrer" className="surface-button">Open channel on YouTube</a>
              </div> : null}
            </div>
            <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-[11px] text-[color:var(--desk-muted)]">
              <span>{current?.name} · External broadcast</span>
              {current && !current.directEmbedUrl && current.videoId && <a href={`https://www.youtube.com/watch?v=${current.videoId}`} target="_blank" rel="noopener noreferrer" className="text-[color:var(--desk-accent)] underline">Watch on YouTube</a>}
            </div>
          </>}
        </> : <>
          <div className="px-4 pb-3">
            <p className="surface-muted mb-3">Unverified public search results. Sources may be unrelated or unreliable; inclusion is not endorsement.</p>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); runSearch(searchInput); }}>
              <input aria-label="Search public broadcasts" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search a place or topic" className="min-w-0 flex-1 border border-[var(--desk-line)] bg-[var(--desk-raised)] px-3 py-2 text-[13px]" />
              <button type="submit" className="surface-button" disabled={!searchInput.trim() || searchLoading} aria-label="Search broadcasts"><Search size={17} /></button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">{QUICK_SEARCHES.map((term) => <button key={term} className="surface-button" aria-pressed={query === term} onClick={() => { setSearchInput(term); runSearch(term); }}>{term}</button>)}</div>
          </div>
          {searchLoading ? <p className="surface-muted p-4" role="status">Searching public broadcasts...</p> : searchError ? <p className="surface-error p-4" role="alert">{searchError}</p> : results.length ? <>
            <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
              {currentResult && <iframe key={currentResult.videoId} src={`https://www.youtube.com/embed/${currentResult.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={currentResult.title} />}
            </div>
            <div className="max-h-52 overflow-y-auto">{results.map((result, index) => <button key={result.videoId} onClick={() => setSearchActive(index)} aria-pressed={searchActive === index} className={`block w-full border-b border-[var(--desk-line)] p-4 text-left text-[13px] leading-relaxed ${searchActive === index ? "bg-[var(--desk-raised)] text-[color:var(--desk-accent)]" : "text-[color:var(--desk-text)]"}`}>
              {result.title}<span className="block text-[11px] text-[color:var(--desk-muted)]">{result.channelTitle}</span>
            </button>)}</div>
          </> : <p className="surface-muted p-4">{query ? `No broadcasts found for "${query}".` : "Choose a topic or enter a search."}</p>}
        </>}
      </>}
    </section>
  );
}
