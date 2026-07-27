import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Already caches the underlying YouTube fetch for 30 min (see below) — no need
// to force this route to be fully dynamic on top of that.
export const revalidate = 1800;

const CHANNELS = [
  { name: "Al Jazeera", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", region: "GLOBAL" },
  { name: "DW News",    channelId: "UCknLrEdhRCp1aegoMqRaCZg", region: "EUROPE" },
  { name: "France 24",  channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", region: "EUROPE" },
  { name: "Sky News",   channelId: "UCoMdktPbSTixAyNGwb-UYkQ", region: "UK"     },
  { name: "WION",       channelId: "UCVFiKFMPOWVhGelNMXLRxSA", region: "ASIA"   },
  { name: "NewsNation", channelId: "UCX4RNV1UzR-_bMGFSB7KxDA", region: "US"     },
  { name: "Fox News",   channelId: "UCXIJgqnII2ZOINSWNOGFThA", region: "US"     },
  { name: "CNN",        channelId: "UCupvZG-5ko_eiXAupbDfxWw", region: "US"     },
];

async function getLiveVideoId(channelId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return null;
    return items[0].id.videoId;
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
async function searchLiveVideos(query: string): Promise<SearchResult[]> {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query + " live"
    )}&eventType=live&type=video&order=relevance&maxResults=8&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min — search results churn faster than curated channels
    const data = await res.json();
    const items = data.items || [];
    return items.map((it: any) => ({
      videoId: it.id.videoId,
      title: it.snippet.title,
      channelTitle: it.snippet.channelTitle,
      thumbnail: it.snippet.thumbnails?.default?.url ?? null,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "No YouTube API key configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q");

  if (mode === "search" && query) {
    const results = await searchLiveVideos(query);
    return NextResponse.json({ mode: "search", query, results });
  }

  const results = await Promise.all(
    CHANNELS.map(async (ch) => ({
      name: ch.name,
      region: ch.region,
      channelId: ch.channelId,
      videoId: await getLiveVideoId(ch.channelId),
    }))
  );

  return NextResponse.json(results);
}
