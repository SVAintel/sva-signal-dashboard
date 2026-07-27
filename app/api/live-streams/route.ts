import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export const dynamic = "force-dynamic";

const CHANNELS = [
  { name: "Al Jazeera", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", region: "GLOBAL" },
  { name: "DW News",    channelId: "UCknLrEdhRCp1aegoMqRaCZg", region: "EUROPE" },
  { name: "France 24",  channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", region: "EUROPE" },
  { name: "Sky News",   channelId: "UCoMdktPbSTixAyNGwb-UYkQ", region: "UK"     },
  { name: "WION",       channelId: "UCVFiKFMPOWVhGelNMXLRxSA", region: "ASIA"   },
  { name: "NewsNation", channelId: "UCX4RNV1UzR-_bMGFSB7KxDA", region: "US"     },
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

export async function GET() {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "No YouTube API key configured" }, { status: 500 });
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
