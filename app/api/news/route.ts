import { RSS_FEEDS, OPINION_RSS_FEEDS, getRssParser } from "@/lib/event-generator";

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";

// NewsAPI's free tier caps out at 100 requests/24h, shared across this route
// AND the two NewsAPI calls inside lib/event-generator.ts. Set generously long
// (4h) so combined usage across all 3 call sites stays well under quota.
export const revalidate = 14400;

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image?: string;
  source: string;
  publishedAt: string;
}

let rssCache: { data: NewsItem[]; ts: number } | null = null;
const RSS_CACHE_MS = 10 * 60 * 1000; // 10 minutes — RSS has no quota, but no need to hammer it every load

// Pull every configured RSS feed (world news + dedicated opinion/analysis
// feeds) with no breaking-news filtering — this panel is a raw, wide-angle
// feed, unlike the map's curated hard-news event stream.
async function fetchAllRSSNews(): Promise<NewsItem[]> {
  const now = Date.now();
  if (rssCache && now - rssCache.ts < RSS_CACHE_MS) {
    return rssCache.data;
  }

  const parser = getRssParser();
  const allFeeds = [...RSS_FEEDS, ...OPINION_RSS_FEEDS];
  const results = await Promise.allSettled(
    allFeeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return { feed, items: parsed.items || [] };
    })
  );

  const out: NewsItem[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { feed, items } = r.value;
    for (const item of items.slice(0, 15)) {
      if (!item.title) continue;
      out.push({
        title: item.title,
        description: item.contentSnippet || item.content || item.summary || "",
        url: item.link || feed.url,
        image: (item as any).enclosure?.url,
        source: feed.name,
        publishedAt: item.isoDate || new Date().toISOString(),
      });
    }
  }

  rssCache = { data: out, ts: now };
  return out;
}

export async function GET() {
  let newsApiItems: NewsItem[] = [];

  if (NEWS_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?category=general&sortBy=publishedAt&language=en&pageSize=30&apiKey=${NEWS_API_KEY}`,
        { signal: controller.signal, next: { revalidate: 14400 } }
      );
      clearTimeout(timeout);

      const data = await res.json();

      if (data.status === "error") {
        console.error("News API error response:", data.code, data.message);
      } else {
        newsApiItems = (data.articles || []).map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          image: article.urlToImage,
          source: article.source.name,
          publishedAt: article.publishedAt,
        }));
      }
    } catch (e) {
      console.error("News API error:", e);
    }
  }

  let rssItems: NewsItem[] = [];
  try {
    rssItems = await fetchAllRSSNews();
  } catch (e) {
    console.error("RSS news error:", e);
  }

  const combined = [...newsApiItems, ...rssItems];

  // Dedupe by title, then sort newest first
  const seen = new Set<string>();
  const unique = combined.filter((item) => {
    const key = item.title?.slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return Response.json(unique.slice(0, 80));
}

