import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
// Keyword search burns 100 quota units per call against YouTube's 10,000/day
// free quota (~100 searches/day total) — shared with the curated-channels
// feature would starve both. Use a separate API key/project for search so
// the two features don't compete for the same daily quota.
const YOUTUBE_SEARCH_API_KEY = process.env.YOUTUBE_SEARCH_API_KEY || YOUTUBE_API_KEY;

// Already caches the underlying YouTube fetch for 30 min (see below) — no need
// to force this route to be fully dynamic on top of that.
export const revalidate = 1800;

const CHANNELS = [
  // Al Jazeera runs its own Brightcove-hosted live player (found on
  // aljazeera.com/video/live) that's freely embeddable and independent of
  // YouTube's embed restrictions — use it directly instead of the YouTube
  // fallback, since YouTube now rejects embedding several of these news
  // channels' live streams with "Error 153" (embedding disabled by the
  // channel, or stricter origin checks — outside our control).
  {
    name: "Al Jazeera",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    region: "GLOBAL",
    // autoplay=true + muted=true matches the other channels' muted-autoplay
    // behavior — browsers block unmuted autoplay, so it must start muted.
    directEmbedUrl: "https://players.brightcove.net/665003303001/AvByVmBYDu_default/index.html?videoId=6368602483112&autoplay=true&muted=true",
  },
  // NHK World-Japan and CGTN both publish official, unauthenticated HLS live
  // feeds directly from their own infrastructure (nhkworld.jp / Amagi-Rakuten
  // FAST syndication for CGTN) — verified reachable and genuinely live.
  // These bypass YouTube entirely, same rationale as Al Jazeera above.
  {
    name: "NHK World",
    channelId: "",
    region: "ASIA",
    hlsUrl: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8",
  },
  {
    name: "CGTN",
    channelId: "",
    region: "ASIA",
    hlsUrl: "https://amg00405-rakutentv-cgtn-rakuten-i9tar.amagi.tv/master.m3u8",
  },
  { name: "DW News",    channelId: "UCknLrEdhRCp1aegoMqRaCZg", region: "EUROPE" },
  { name: "France 24",  channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", region: "EUROPE" },
  { name: "Sky News",   channelId: "UCoMdktPbSTixAyNGwb-UYkQ", region: "UK"     },
  { name: "Fox News",   channelId: "UCXIJgqnII2ZOINSWNOGFThA", region: "US"     },
  { name: "CNN",        channelId: "UCupvZG-5ko_eiXAupbDfxWw", region: "US"     },
];

// Detect a channel's current live video with ZERO API quota cost, by
// scraping YouTube's own /live redirect page instead of calling the
// (expensive, 100-units-per-call) search.list endpoint. When a channel is
// live, YouTube embeds a `videoDetails` block with the live video's ID and
// an `isLive:true` flag directly in the page's initial player data; when
// not live, that block is absent entirely. This is what YouTube's own web
// player relies on, so it's stable, and avoids burning search quota just to
// poll 8 channels every 30 minutes.
async function getLiveVideoId(channelId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 1800 }, // cache 30 min
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes('"isLive":true')) return null;
    // YouTube has changed this page's internal JSON structure over time. The
    // old "videoDetails":{"videoId":"..."} anchor no longer exists, and a
    // bare `"videoId":"..."` grab is unreliable (it can match a *related*
    // video's endpoint instead of the one actually playing). The
    // `currentVideoEndpoint` block is the one YouTube's own player uses to
    // know what's currently loaded, so anchor on that instead.
    const match = html.match(/"currentVideoEndpoint":\{[^}]*"url":"\/watch\?v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
}

// Unvetted keyword search across all of YouTube for live streams matching a
// war-zone/region query. Results are NOT curated — quality/legitimacy of the
// source varies, so the UI must clearly label this as an unverified mode.
async function searchLiveVideos(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  if (!YOUTUBE_SEARCH_API_KEY) return { results: [], error: "No YouTube search API key configured" };
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query + " live"
    )}&eventType=live&type=video&order=relevance&maxResults=8&key=${YOUTUBE_SEARCH_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min — search results churn faster than curated channels
    const data = await res.json();
    if (data.error) {
      const reason = data.error?.errors?.[0]?.reason || data.error?.status || "unknown";
      console.error("YouTube search error:", reason, data.error?.message);
      const quotaExceeded = reason === "rateLimitExceeded" || reason === "quotaExceeded";
      return {
        results: [],
        error: quotaExceeded
          ? "Live search quota exceeded for today — resets at midnight Pacific. Try again tomorrow."
          : "Live search is temporarily unavailable.",
      };
    }
    const items = data.items || [];
    // Dedupe by channel — a single channel can post multiple live streams
    // matching the same keyword (e.g. NHK World appearing 3x), which just
    // clutters the unverified search results. Keep only the most relevant
    // (first) video per channel.
    const seenChannels = new Set<string>();
    const deduped = items.filter((it: any) => {
      const channel = it.snippet.channelTitle;
      if (seenChannels.has(channel)) return false;
      seenChannels.add(channel);
      return true;
    });
    return {
      results: deduped.map((it: any) => ({
        videoId: it.id.videoId,
        title: it.snippet.title,
        channelTitle: it.snippet.channelTitle,
        thumbnail: it.snippet.thumbnails?.default?.url ?? null,
      })),
    };
  } catch (err) {
    console.error("YouTube search fetch failed:", err);
    return { results: [], error: "Live search is temporarily unavailable." };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q");

  if (mode === "search" && query) {
    const { results, error } = await searchLiveVideos(query);
    return NextResponse.json({ mode: "search", query, results, error });
  }

  const results = await Promise.all(
    CHANNELS.map(async (ch) => ({
      name: ch.name,
      region: ch.region,
      channelId: ch.channelId,
      directEmbedUrl: (ch as any).directEmbedUrl ?? null,
      hlsUrl: (ch as any).hlsUrl ?? null,
      // Skip the YouTube live-detection scrape entirely for channels with a
      // direct broadcaster embed — we don't need a YouTube videoId for them.
      videoId: (ch as any).directEmbedUrl || (ch as any).hlsUrl ? null : await getLiveVideoId(ch.channelId),
    }))
  );

  return NextResponse.json(results);
}
