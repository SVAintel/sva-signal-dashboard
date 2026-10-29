"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Channel {
  name: string; region: string; channelId: string; videoId: string | null;
  directEmbedUrl?: string | null; hlsUrl?: string | null;
}
export type { Channel };
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
  onActiveChannelChange?: (channel: ActiveLiveChannel | null) => void;
  onChannelsChange?: (channels: Channel[]) => void;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onClose?: () => void;
}

export default function LiveBroadcasts({ onActiveChannelChange, onChannelsChange, activeIndex, onActiveIndexChange, onClose }: LiveBroadcastsProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState(0);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const channelMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [override, setOverride] = useState<{ videoId: string; title: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequest = useRef(0);
  useEffect(() => {
    fetch("/api/live-streams")
      .then((response) => { if (!response.ok) throw new Error("Failed to load broadcast sources"); return response.json(); })
      .then((data: Channel[]) => {
        setChannels(data);
        onChannelsChange?.(data);
        const first = data.findIndex((channel) => channel.videoId || channel.directEmbedUrl || channel.hlsUrl);
        setActive(first >= 0 ? first : 0);
      })
      .catch(() => setError("Broadcast sources could not be loaded."))
      .finally(() => setLoading(false));
  }, [onChannelsChange]);
  useEffect(() => { onActiveIndexChange?.(active); }, [active, onActiveIndexChange]);
  useEffect(() => { if (activeIndex !== undefined && activeIndex !== active) setActive(activeIndex); }, [activeIndex]);
  useEffect(() => {
    if (!channelMenuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !channelMenuRef.current?.contains(event.target)) setChannelMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setChannelMenuOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [channelMenuOpen]);
  useEffect(() => {
    if (!searchOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchMenuRef.current?.contains(event.target)) setSearchOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setSearchOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [searchOpen]);

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
      if (!data.results?.length && data.error) setSearchError(data.error);
    } catch (err) {
      if (request === searchRequest.current) setSearchError(err instanceof Error ? err.message : "Broadcast search failed");
    } finally { if (request === searchRequest.current) setSearchLoading(false); }
  }
  const current = channels[active];
  useEffect(() => {
    onActiveChannelChange?.(current ? {
      name: current.name, videoId: current.videoId, directEmbedUrl: current.directEmbedUrl, hlsUrl: current.hlsUrl,
    } : null);
  }, [current, onActiveChannelChange]);

  return (
    <section className="broadcast-panel" aria-label="Live broadcasts">
      <div className="broadcast-heading">
        <div className="broadcast-channel-picker" ref={channelMenuRef}>
          <button aria-expanded={channelMenuOpen} aria-label="Choose broadcast channel" onClick={() => { setChannelMenuOpen((open) => !open); setSearchOpen(false); }}>
            <span>{override ? override.title : current ? current.name : "News channels"}</span><ChevronDown size={13} />
          </button>
          {channelMenuOpen && channels.length > 0 && (
            <div className="broadcast-channel-menu" role="listbox" aria-label="Broadcast channels">
              {channels.map((channel, index) => (
                <button key={channel.name} role="option" aria-selected={index === active && !override}
                  className={index === active && !override ? "is-active" : undefined}
                  onClick={() => { setOverride(null); setActive(index); setChannelMenuOpen(false); }}>
                  {channel.name} · {channel.region}{channel.videoId || channel.directEmbedUrl || channel.hlsUrl ? "" : " · Unavailable"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="broadcast-search" ref={searchMenuRef}>
          <button className="broadcast-search-trigger" aria-expanded={searchOpen} aria-label="Search YouTube broadcasts" onClick={() => { setSearchOpen((open) => !open); setChannelMenuOpen(false); }}>
            <Search size={13} />
          </button>
          {searchOpen && (
            <div className="broadcast-search-menu">
              <p className="broadcast-search-note">Unverified public search results. Sources may be unrelated or unreliable; inclusion is not endorsement.</p>
              <form onSubmit={(event) => { event.preventDefault(); runSearch(searchInput); }}>
                <input aria-label="Search public broadcasts" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search a place or topic" />
                <button type="submit" aria-label="Search" disabled={!searchInput.trim() || searchLoading}><Search size={13} /></button>
              </form>
              <div className="broadcast-search-chips">{QUICK_SEARCHES.map((term) => <button key={term} className="broadcast-chip" aria-pressed={query === term} onClick={() => { setSearchInput(term); runSearch(term); }}>{term}</button>)}</div>
              {searchLoading ? <p className="broadcast-search-status">Searching...</p>
                : searchError ? <p className="broadcast-search-status">{searchError}</p>
                : results.length ? (
                  <div className="broadcast-search-results">
                    {results.map((result) => (
                      <button key={result.videoId} className={override?.videoId === result.videoId ? "is-active" : ""}
                        onClick={() => { setOverride({ title: result.title, videoId: result.videoId }); setSearchOpen(false); }}>
                        {result.title}
                      </button>
                    ))}
                  </div>
                ) : query ? <p className="broadcast-search-status">No results for &quot;{query}&quot;.</p> : null}
            </div>
          )}
        </div>
        {onClose && <button aria-label="Collapse live broadcasts" onClick={onClose}><X size={15} /></button>}
      </div>
      {loading ? <p className="surface-muted px-4 pb-2" role="status">Loading broadcast sources...</p> : error ? <p className="surface-error px-4 pb-2" role="alert">{error}</p> : !channels.length ? <p className="surface-muted px-4 pb-2">No broadcast sources are available.</p> : <>
        <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
          {override ? (
            <iframe key={override.videoId} src={`https://www.youtube.com/embed/${override.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={override.title} />
          ) : current?.hlsUrl ? <HlsVideo key={current.hlsUrl} src={current.hlsUrl} title={`${current.name} broadcast`} /> : current?.directEmbedUrl ? (
            <iframe key={current.directEmbedUrl} src={current.directEmbedUrl} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={`${current.name} broadcast`} />
          ) : current?.videoId ? (
            <iframe key={current.videoId} src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" title={`${current.name} broadcast`} />
          ) : current ? <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
            <p className="surface-muted">No embeddable stream is available for {current.name}.</p>
            <a href={`https://www.youtube.com/channel/${current.channelId}/live`} target="_blank" rel="noopener noreferrer" className="surface-button">Open channel on YouTube</a>
          </div> : null}
        </div>
      </>}
    </section>
  );
}
