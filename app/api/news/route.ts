import { THINK_TANK_FEEDS, getRssParser } from "@/lib/event-generator";

// This route now serves the "Global Analysis" panel exclusively from think
// tank / policy research RSS feeds (RAND, CSIS, Brookings, Atlantic Council,
// Carnegie Endowment, Crisis Group, Stratfor, AEI) — no general wire news,
// no NewsAPI. Free, no API key, no rate-limit quota.
export const revalidate = 1800;

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image?: string;
  source: string;
  publishedAt: string;
}

let rssCache: { data: NewsItem[]; ts: number } | null = null;
const RSS_CACHE_MS = 5 * 60 * 1000; // 5 minutes — matches the panel's client poll interval

// Most think tank feeds don't include <enclosure>/media:content image tags,
// so preview images are resolved two ways: (1) a quick regex pull of the
// first <img> straight out of the feed's own HTML content (covers feeds like
// Brookings/AEI that do inline one), and (2) for everything else, a one-time
// scrape of the article page's og:image meta tag. Scraped results are cached
// per-URL for 24h (og:image essentially never changes for a published
// article) so repeat RSS cache refreshes don't re-scrape the same articles.
const ogImageCache = new Map<string, { image: string | null; ts: number }>();
const OG_IMAGE_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours
const OG_IMAGE_SCRAPE_LIMIT = 40; // cap how many article pages we scrape per refresh

function extractImgFromHtml(html?: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

async function fetchOgImage(url: string): Promise<string | null> {
  const cached = ogImageCache.get(url);
  if (cached && Date.now() - cached.ts < OG_IMAGE_CACHE_MS) {
    return cached.image;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SVASignalDashboard/1.0)" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      null;
    ogImageCache.set(url, { image: og, ts: Date.now() });
    return og;
  } catch {
    ogImageCache.set(url, { image: null, ts: Date.now() });
    return null;
  }
}

async function fetchThinkTankFeeds(): Promise<NewsItem[]> {
  const now = Date.now();
  if (rssCache && now - rssCache.ts < RSS_CACHE_MS) {
    return rssCache.data;
  }

  const parser = getRssParser();
  const results = await Promise.allSettled(
    THINK_TANK_FEEDS.map(async (feed) => {
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
        image: (item as any).enclosure?.url || extractImgFromHtml(item.content || item["content:encoded"]),
        source: feed.name,
        publishedAt: item.isoDate || new Date().toISOString(),
      });
    }
  }

  rssCache = { data: out, ts: now };
  return out;
}

export async function GET() {
  let items: NewsItem[] = [];
  try {
    items = await fetchThinkTankFeeds();
  } catch (e) {
    console.error("Think tank RSS error:", e);
  }

  // Dedupe by title, then sort newest first
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.title?.slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const top = unique.slice(0, 80);

  // Fill in missing preview images by scraping each article's og:image, for
  // the first N items lacking one — capped so a fully-cold cache doesn't
  // block the response on dozens of article-page fetches at once.
  const missing = top.filter((item) => !item.image).slice(0, OG_IMAGE_SCRAPE_LIMIT);
  if (missing.length > 0) {
    const scraped = await Promise.allSettled(missing.map((item) => fetchOgImage(item.url)));
    scraped.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        missing[i].image = result.value;
      }
    });
  }

  return Response.json(top);
}
