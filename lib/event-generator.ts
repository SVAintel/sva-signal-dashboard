import { Event } from "@/lib/types";
import Parser from "rss-parser";

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Geocode by scanning article text for known place names.
// Returns best match or a random plausible land coordinate as fallback.
const GEO_LOOKUP: Array<{ names: string[]; lat: number; lng: number }> = [
  // Middle East
  { names: ["ukraine", "kyiv", "kiev", "kharkiv", "odessa", "zaporizhzhia"], lat: 49.0, lng: 31.5 },
  { names: ["russia", "moscow", "kremlin", "russian"], lat: 61.0, lng: 60.0 },
  { names: ["israel", "tel aviv", "jerusalem", "gaza", "west bank", "hamas", "idf", "netanyahu"], lat: 31.5, lng: 34.8 },
  { names: ["iran", "tehran", "iranian", "irgc"], lat: 32.0, lng: 53.0 },
  { names: ["iraq", "baghdad", "iraqi", "mosul", "erbil"], lat: 33.0, lng: 44.0 },
  { names: ["syria", "damascus", "aleppo", "syrian"], lat: 34.8, lng: 38.9 },
  { names: ["lebanon", "beirut", "hezbollah"], lat: 33.9, lng: 35.5 },
  { names: ["saudi arabia", "riyadh", "saudi"], lat: 24.0, lng: 45.0 },
  { names: ["yemen", "sanaa", "houthi"], lat: 15.5, lng: 48.0 },
  { names: ["turkey", "ankara", "istanbul", "erdogan", "turkish"], lat: 39.0, lng: 35.0 },
  { names: ["egypt", "cairo", "egyptian"], lat: 26.0, lng: 30.0 },
  { names: ["jordan", "amman", "jordanian"], lat: 31.0, lng: 36.0 },
  { names: ["afghanistan", "kabul", "taliban"], lat: 33.0, lng: 65.0 },
  { names: ["pakistan", "islamabad", "karachi", "lahore", "pakistani"], lat: 30.0, lng: 69.0 },
  // Africa
  { names: ["sudan", "khartoum", "sudanese", "darfur"], lat: 15.0, lng: 30.0 },
  { names: ["ethiopia", "addis ababa", "ethiopian", "tigray"], lat: 9.0, lng: 40.5 },
  { names: ["somalia", "mogadishu", "somali", "al-shabaab"], lat: 5.0, lng: 46.0 },
  { names: ["nigeria", "abuja", "lagos", "boko haram"], lat: 9.0, lng: 8.0 },
  { names: ["mali", "bamako", "malian", "sahel"], lat: 17.0, lng: -4.0 },
  { names: ["congo", "drc", "kinshasa", "m23"], lat: -4.0, lng: 24.0 },
  { names: ["kenya", "nairobi", "kenyan"], lat: -1.0, lng: 37.5 },
  { names: ["south africa", "johannesburg", "cape town"], lat: -29.0, lng: 25.0 },
  { names: ["libya", "tripoli", "benghazi", "libyan"], lat: 27.0, lng: 18.0 },
  { names: ["mozambique", "maputo"], lat: -18.0, lng: 35.0 },
  { names: ["burkina faso", "ouagadougou"], lat: 12.0, lng: -1.5 },
  // Asia Pacific
  { names: ["china", "beijing", "shanghai", "xi jinping", "chinese", "prc", "ccp"], lat: 35.0, lng: 105.0 },
  { names: ["north korea", "pyongyang", "kim jong", "dprk", "icbm"], lat: 40.0, lng: 127.0 },
  { names: ["south korea", "seoul", "korean"], lat: 37.0, lng: 127.5 },
  { names: ["taiwan", "taipei"], lat: 23.5, lng: 121.0 },
  { names: ["india", "new delhi", "delhi", "mumbai", "modi", "indian"], lat: 20.0, lng: 78.0 },
  { names: ["myanmar", "burma", "yangon", "junta"], lat: 17.0, lng: 96.0 },
  { names: ["bangladesh", "dhaka"], lat: 23.7, lng: 90.4 },
  { names: ["japan", "tokyo", "osaka", "japanese"], lat: 36.0, lng: 138.0 },
  { names: ["indonesia", "jakarta", "indonesian"], lat: -5.0, lng: 120.0 },
  { names: ["philippines", "manila", "philippine"], lat: 12.0, lng: 122.0 },
  { names: ["thailand", "bangkok", "thai"], lat: 15.0, lng: 101.0 },
  { names: ["vietnam", "hanoi", "ho chi minh"], lat: 16.0, lng: 107.0 },
  // Europe
  { names: ["france", "paris", "french", "macron"], lat: 46.0, lng: 2.0 },
  { names: ["germany", "berlin", "german", "bundeswehr"], lat: 51.0, lng: 10.0 },
  { names: ["uk", "united kingdom", "london", "britain", "british", "boris", "sunak"], lat: 52.5, lng: -1.5 },
  { names: ["poland", "warsaw", "polish"], lat: 52.0, lng: 20.0 },
  { names: ["hungary", "budapest", "orban"], lat: 47.0, lng: 19.0 },
  { names: ["serbia", "belgrade", "serbian"], lat: 44.0, lng: 21.0 },
  { names: ["romania", "bucharest"], lat: 45.9, lng: 24.9 },
  { names: ["spain", "madrid", "barcelona", "spanish"], lat: 40.0, lng: -4.0 },
  { names: ["italy", "rome", "milan", "italian"], lat: 42.5, lng: 12.5 },
  { names: ["greece", "athens", "greek"], lat: 39.0, lng: 22.0 },
  { names: ["sweden", "stockholm", "swedish"], lat: 60.0, lng: 15.0 },
  { names: ["finland", "helsinki", "finnish"], lat: 64.0, lng: 26.0 },
  { names: ["belarus", "minsk", "lukashenko"], lat: 53.7, lng: 27.9 },
  // Americas
  { names: ["united states", "washington", "pentagon", "white house", "u.s.", "us congress", "biden", "trump", "america"], lat: 38.0, lng: -97.0 },
  { names: ["mexico", "mexico city", "cartel", "mexican"], lat: 23.0, lng: -102.0 },
  { names: ["colombia", "bogota", "colombian", "farc"], lat: 4.0, lng: -72.0 },
  { names: ["venezuela", "caracas", "maduro"], lat: 8.0, lng: -66.0 },
  { names: ["brazil", "brasilia", "rio", "lula", "brazilian"], lat: -10.0, lng: -55.0 },
  { names: ["haiti", "port-au-prince", "haitian"], lat: 19.0, lng: -72.0 },
  { names: ["cuba", "havana", "cuban"], lat: 22.0, lng: -79.0 },
  { names: ["ecuador", "quito"], lat: -2.0, lng: -77.5 },
  { names: ["peru", "lima"], lat: -10.0, lng: -75.0 },
  { names: ["chile", "santiago"], lat: -35.0, lng: -71.0 },
  { names: ["argentina", "buenos aires"], lat: -34.0, lng: -64.0 },
  { names: ["canada", "ottawa", "toronto"], lat: 56.0, lng: -96.0 },
];

// Random land-biased fallback (Eurasia/Africa band)
const LAND_FALLBACKS = [
  { lat: 48.0, lng: 15.0 },  // Central Europe
  { lat: 30.0, lng: 35.0 },  // Middle East
  { lat: 15.0, lng: 20.0 },  // Sahel
  { lat: 28.0, lng: 77.0 },  // South Asia
  { lat: 35.0, lng: 105.0 }, // East Asia
  { lat: -5.0, lng: 25.0 },  // Central Africa
  { lat: 10.0, lng: -5.0 },  // West Africa
  { lat: 38.0, lng: -97.0 }, // USA
  { lat: -15.0, lng: -55.0 },// Brazil
  { lat: 55.0, lng: 37.0 },  // Russia/Moscow
];

function geolocateFromText(text: string): { lat: number; lng: number } {
  const lower = text.toLowerCase();
  for (const entry of GEO_LOOKUP) {
    if (entry.names.some(name => lower.includes(name))) {
      // Add small jitter so overlapping events don't stack exactly
      return {
        lat: entry.lat + (Math.random() - 0.5) * 2,
        lng: entry.lng + (Math.random() - 0.5) * 2,
      };
    }
  }
  // No match — pick a random land fallback instead of open ocean
  const fb = LAND_FALLBACKS[Math.floor(Math.random() * LAND_FALLBACKS.length)];
  return { lat: fb.lat + (Math.random() - 0.5) * 4, lng: fb.lng + (Math.random() - 0.5) * 4 };
}

// Fetch events from all real APIs with timeout
export async function generateMockEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let eventId = 1;

  try {
    // Fetch from real APIs in parallel with 5 second timeout each
    const results = await Promise.allSettled([
      fetchNewsAPIEvents(),
      fetchRSSEvents(),
      fetchAlphaVantageEvents(),
      fetchUSGSEvents(),
      fetchGDELTEvents(),
      fetchACLEDEvents(),
      fetchCoinGeckoEvents(),
      fetchEMSCEvents(),
    ]);

    const allEvents = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => (r as any).value || []);

    for (const rawEvent of allEvents) {
      const category = rawEvent.category as keyof typeof knownKnownsMap;
      const event: Event = {
        id: `evt-${String(eventId++).padStart(4, "0")}`,
        title: rawEvent.title,
        description: rawEvent.description,
        category: rawEvent.category,
        location: rawEvent.location,
        source: rawEvent.source,
        url: rawEvent.url,
        timestamp: rawEvent.timestamp,
        aiNotes: knownKnownsMap[category]?.[Math.floor(Math.random() * knownKnownsMap[category].length)] || "Event under analysis",
        confidence: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
      };
      events.push(event);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return events.length > 0 ? events : getFallbackEvents();
}

// Fallback events if APIs fail
function getFallbackEvents(): Event[] {
  return [
    {
      id: "evt-0001",
      title: "Global Intelligence Dashboard - Live",
      description: "Real-time events from NewsAPI, RSS feeds, Alpha Vantage, USGS, GDELT, ACLED, CoinGecko, and EMSC",
      category: "war",
      location: { lat: 35, lng: 0 },
      source: "Dashboard",
      timestamp: new Date().toISOString(),
      aiNotes: "Waiting for live API data...",
      confidence: "pending",
    },
  ];
}

// Shared text-classification helpers used by both NewsAPI and RSS ingestion
const NEWS_EXCLUDE_KEYWORDS = [
  "opinion", "editorial", "analysis:", "commentary", "column:", "review",
  "how to", "tips for", "best of", "ranked:", "why you", "what you need",
  "smithsonian", "museum", "anime", "crunchyroll", "movie", "film", "box office",
  "actor", "celebrity", "oscars", "concert", "music chart", "sports",
  "video game", "esports", "nfl", "nba", "mlb", "fifa", "premier league",
  "entertainment", "streaming", "sequel", "tv show", "reality show",
  "recipe", "fashion", "beauty", "horoscope", "crossword",
];

const NEWS_BREAKING_SIGNALS = [
  "killed", "dead", "attack", "airstrike", "missile", "bomb", "explosion",
  "troops", "invasion", "seized", "arrest", "detained", "sanction", "strike",
  "outbreak", "virus", "pandemic", "epidemic", "contamination",
  "cyberattack", "hack", "breach", "ransomware",
  "nuclear", "radiation", "warhead", "reactor",
  "protest", "riot", "coup", "unrest", "demonstration",
  "refugee", "displaced", "famine", "humanitarian crisis",
  "pipeline", "blackout", "power grid", "energy crisis",
  "breaking", "urgent", "developing", "update:", "latest:",
  "fires on", "clashes", "offensive", "ceasefire", "escalat",
];

function isBreakingNews(title: string, desc: string) {
  const text = (title + " " + desc).toLowerCase();
  if (NEWS_EXCLUDE_KEYWORDS.some(kw => text.includes(kw))) return false;
  return NEWS_BREAKING_SIGNALS.some(kw => text.includes(kw));
}

function categorizeNewsText(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (["outbreak", "pandemic", "disease", "virus", "pathogen", "bioterror", "epidemic", "plague", "infection", "contamination"].some(kw => text.includes(kw)))
    return "biological";
  if (["protest", "coup", "uprising", "riot", "civil unrest", "election fraud", "demonstrations", "political crisis", "impeach", "overthrow"].some(kw => text.includes(kw)))
    return "political_unrest";
  if (["cyberattack", "ransomware", "hacking", "data breach", "malware", "phishing", "cyber", "infrastructure attack"].some(kw => text.includes(kw)))
    return "cyber";
  if (["nuclear", "radiation", "iaea", "proliferation", "uranium", "warhead", "reactor accident", "dirty bomb"].some(kw => text.includes(kw)))
    return "nuclear";
  if (["energy crisis", "pipeline", "oil sanction", "gas supply", "energy security", "blackout", "power grid"].some(kw => text.includes(kw)))
    return "energy";
  if (["refugee", "famine", "humanitarian", "displaced", "aid worker", "starvation", "food crisis", "human rights"].some(kw => text.includes(kw)))
    return "humanitarian";
  if (["terror", "isis", "al-qaeda", "bombing", "jihad", "extremist"].some(kw => text.includes(kw)))
    return "counter_terrorism";
  return "war";
}

// NewsAPI - breaking news for live geopolitical/threat events
async function fetchNewsAPIEvents() {
  if (!NEWS_API_KEY) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // top-headlines with category=general gives breaking news, not editorials
    // We fetch two passes: world headlines + specific threat keywords
    const [headlinesRes, everythingRes] = await Promise.all([
      fetch(
        `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=50&apiKey=${NEWS_API_KEY}`,
        { signal: controller.signal, next: { revalidate: 14400 } } // 4h — NewsAPI free tier caps at 100 req/24h across all call sites
      ),
      fetch(
        `https://newsapi.org/v2/everything?q=attack+OR+airstrike+OR+missile+OR+shooting+OR+explosion+OR+troops+OR+outbreak+OR+cyberattack+OR+nuclear+OR+coup+OR+arrested+OR+sanctions&sortBy=publishedAt&language=en&pageSize=50&apiKey=${NEWS_API_KEY}`,
        { signal: controller.signal, next: { revalidate: 14400 } }
      ),
    ]);
    clearTimeout(timeout);

    const [h, e] = await Promise.all([headlinesRes.json(), everythingRes.json()]);
    const combined: any[] = [...(h.articles || []), ...(e.articles || [])];

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = combined.filter(a => {
      const key = a.title?.slice(0, 60);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const categoryCounts: Record<string, number> = {};

    return unique
      .filter((article: any) => isBreakingNews(article.title || "", article.description || ""))
      .reduce((acc: any[], article: any) => {
        const category = categorizeNewsText(article.title, article.description || "");
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        if (categoryCounts[category] > 5) return acc; // max 5 per category
        acc.push({
          title: article.title,
          description: article.description || "Breaking news",
          location: geolocateFromText(article.title + " " + (article.description || "") + " " + (article.source?.name || "")),
          source: `NewsAPI / ${article.source?.name || "Unknown"}`,
          url: article.url,
          category,
          timestamp: new Date(article.publishedAt).toISOString(),
        });
        return acc;
      }, []);
  } catch (e) {
    console.error("NewsAPI error:", e);
    return [];
  }
}

// RSS feeds — free, no API key, no rate-limit quota. Pulls straight from
// major outlets' public world/breaking-news feeds and runs them through the
// same breaking-news filter + categorizer used for NewsAPI, so this scales up
// event volume without touching any metered API budget.
export const RSS_FEEDS: { name: string; url: string }[] = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "DW World", url: "https://rss.dw.com/rdf/rss-en-world" },
  { name: "Sky News World", url: "https://feeds.skynews.com/feeds/rss/world.xml" },
  { name: "France24 World", url: "https://www.france24.com/en/rss" },
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
];

// Opinion/editorial/analysis feeds — kept separate from the hard-news list
// above because these are explicitly commentary, not breaking events, and
// should never feed the map's event-classification pipeline. Used only by
// the Live News side panel (app/api/news/route.ts) which is unfiltered.
export const OPINION_RSS_FEEDS: { name: string; url: string }[] = [
  { name: "The Guardian Opinion", url: "https://www.theguardian.com/commentisfree/rss" },
  { name: "NYT Opinion", url: "https://rss.nytimes.com/services/xml/rss/nyt/Opinion.xml" },
];

let rssParser: Parser | null = null;
export function getRssParser() {
  if (!rssParser) {
    rssParser = new Parser({ timeout: 6000 });
  }
  return rssParser;
}

// Module-level in-memory cache (survives across requests within the same
// serverless/lambda instance) so RSS feeds aren't re-fetched on every event
// request — same caching philosophy applied to the metered APIs earlier.
let rssCache: { data: any[]; ts: number } | null = null;
const RSS_CACHE_MS = 10 * 60 * 1000; // 10 minutes

async function fetchRSSEvents() {
  const now = Date.now();
  if (rssCache && now - rssCache.ts < RSS_CACHE_MS) {
    return rssCache.data;
  }

  const parser = getRssParser();
  const categoryCounts: Record<string, number> = {};
  const seen = new Set<string>();
  const out: any[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return { feed, items: parsed.items || [] };
    })
  );

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { feed, items } = r.value;
    for (const item of items) {
      const title = (item.title || "").trim();
      const description = (item.contentSnippet || item.content || item.summary || "").trim();
      if (!title) continue;

      const key = title.slice(0, 60);
      if (seen.has(key)) continue;

      if (!isBreakingNews(title, description)) continue;

      const category = categorizeNewsText(title, description);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      if (categoryCounts[category] > 8) continue; // cap per category across all RSS feeds combined

      seen.add(key);
      out.push({
        title,
        description: description ? description.slice(0, 240) : "Breaking news",
        location: geolocateFromText(title + " " + description + " " + feed.name),
        source: `RSS / ${feed.name}`,
        url: item.link || feed.url,
        category,
        timestamp: item.isoDate ? new Date(item.isoDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  rssCache = { data: out, ts: now };
  return out;
}

// Alpha Vantage - market events (with timeout)
async function fetchAlphaVantageEvents() {
  if (!ALPHA_VANTAGE_KEY) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}`,
      { signal: controller.signal, next: { revalidate: 21600 } } // 6h — Alpha Vantage free tier caps at 25 req/day
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    if (data["Global Quote"]?.["05. price"]) {
      const quote = data["Global Quote"];
      const change = parseFloat(quote["09. change"] || "0");
      return [{
        title: `Market Signal: ${change > 0 ? "Bullish" : "Bearish"} pressure`,
        description: `Tech sector (AAPL) at $${quote["05. price"]}, change: ${change}%`,
        location: { lat: 37.7749, lng: -122.4194 },
        source: "Alpha Vantage",
        url: "https://www.alphavantage.co/", // raw API endpoint needs an apikey param to load; link to the human-readable site instead
        category: "market",
        timestamp: new Date().toISOString(),
      }];
    }
    return [];
  } catch (e) {
    console.error("Alpha Vantage error:", e);
    return [];
  }
}

// USGS Earthquakes - free, no key
async function fetchUSGSEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 6).map((feature: any) => {
      const mag = feature.properties.mag;
      return {
        title: `Seismic Alert: Magnitude ${mag} earthquake`,
        description: feature.properties.title || "Seismic activity detected",
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "USGS",
        url: feature.properties.url || "https://earthquake.usgs.gov",
        category: "natural_disaster",
        timestamp: new Date(feature.properties.time).toISOString(),
      };
    });
  } catch (e) {
    console.error("USGS error:", e);
    return [];
  }
}

// GDELT - geopolitical events (free, 15min delay)
async function fetchGDELTEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.gdeltproject.org/api/v2/search?query=conflict&mode=artlist&maxrecords=6&format=json",
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.articles || []).slice(0, 6).map((article: any) => ({
      title: article.title,
      description: article.snippet || "Geopolitical event detected",
      location: geolocateFromText(article.title + " " + (article.snippet || "")),
      source: "GDELT",
      url: article.url,
      category: "war",
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("GDELT error:", e);
    return [];
  }
}

// ACLED - Armed Conflict Location & Event Data (free, no key needed)
async function fetchACLEDEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.acleddata.com/api/explore/1.0/csv/read/?",
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const text = await res.text();
    const lines = text.split('\n').slice(1, 4); // Get first 3 rows
    
    return lines
      .filter(line => line.trim())
      .map((line: string) => {
        const parts = line.split(',');
        const lat = parseFloat(parts[11]);
        const lng = parseFloat(parts[12]);
        const title = `ACLED Alert: ${parts[5]?.trim() || "Conflict event"}`;
        const desc = `Event type: ${parts[6]?.trim() || "Unknown"} - ${parts[9]?.trim() || ""}`;
        // Use parsed coords only when they look valid (not 0,0 null island)
        const location =
          !isNaN(lat) && !isNaN(lng) && (Math.abs(lat) > 0.5 || Math.abs(lng) > 0.5)
            ? { lat, lng }
            : geolocateFromText(title + " " + desc);
        return {
          title,
          description: desc,
          location,
          source: "ACLED",
          url: "https://acleddata.com/data-export-tool",
          category: parts[5]?.includes("Violence") || parts[5]?.includes("Battle") ? "war" :
                   parts[5]?.includes("Protest") ? "counter_terrorism" : "war",
          timestamp: new Date().toISOString(),
        };
      });
  } catch (e) {
    console.error("ACLED error:", e);
    return [];
  }
}

// CoinGecko - Crypto market volatility (free, no key)
async function fetchCoinGeckoEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.coingecko.com/api/v3/global",
      { signal: controller.signal, next: { revalidate: 900 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    const btcChange = data.data?.btc_market_cap_change_percentage_24h || 0;
    
    return [{
      title: `Crypto Signal: Bitcoin ${btcChange > 0 ? "📈" : "📉"} ${Math.abs(btcChange).toFixed(1)}% (24h)`,
      description: `Global crypto market volatility signal. Total market cap: $${(data.data?.total_market_cap?.usd / 1e9).toFixed(2)}B`,
      location: { lat: 51.5074, lng: -0.1278 }, // London - crypto hub
      source: "CoinGecko",
      url: "https://www.coingecko.com/en/global-charts",
      category: "market",
      timestamp: new Date().toISOString(),
    }];
  } catch (e) {
    console.error("CoinGecko error:", e);
    return [];
  }
}

// EMSC - European Mediterranean Seismic Centre (free, no key)
async function fetchEMSCEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://www.emsc-csem.org/api/test/latest?limit=6&start_year=2023",
      { signal: controller.signal, next: { revalidate: 900 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 6).map((feature: any) => {
      const mag = feature.properties.magnitude;
      return {
        title: `EMSC Alert: Magnitude ${mag} - ${feature.properties.eventLocationName || "European Mediterranean"}`,
        description: `Depth: ${feature.geometry.coordinates[2]}km - EMSC high-precision data`,
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "EMSC",
        url: feature.properties.source_id
          ? `https://www.emsc-csem.org/Earthquake/earthquake.php?id=${feature.properties.source_id}`
          : "https://www.emsc-csem.org",
        category: "natural_disaster",
        timestamp: new Date(feature.properties.origin_time).toISOString(),
      };
    });
  } catch (e) {
    console.error("EMSC error:", e);
    return [];
  }
}

const knownKnownsMap: Record<string, string[]> = {
  war: [
    "Established military deployment pattern",
    "Historical precedent for similar activity",
    "Confirmed unit movements in region",
  ],
  counter_terrorism: [
    "Organization fingerprints detected",
    "Tactical method consistent with group profile",
    "Known supporter networks activated",
  ],
  natural_disaster: [
    "Geological patterns align with historical data",
    "Seismic zone activity detected",
    "Weather model predictions confirmed",
  ],
  market: [
    "Policy signals align with economic theory",
    "Sector rotation follows historical patterns",
    "Technical indicators confirm trend shift",
  ],
  biological: [
    "Pathogen transmission vectors identified",
    "Epidemiological modeling underway",
    "WHO surveillance activated",
  ],
  political_unrest: [
    "Opposition coordination networks active",
    "Historical precedent for regime change",
    "Security forces on elevated alert",
  ],
  cyber: [
    "Attack signature matches known APT group",
    "Infrastructure vulnerability confirmed",
    "Lateral movement indicators detected",
  ],
  nuclear: [
    "Enrichment activity above threshold",
    "IAEA monitoring protocols activated",
    "Delivery system capability assessment underway",
  ],
  energy: [
    "Supply disruption cascading through markets",
    "Strategic reserve drawdown initiated",
    "Geopolitical leverage play confirmed",
  ],
  humanitarian: [
    "IDP movement patterns tracked",
    "Aid corridor access compromised",
    "International response coordination active",
  ],
};

export function filterByProfile(events: Event[], profile: string): Event[] {
  const profileCategoryMap: Record<string, string[]> = {
    osint: ["war", "counter_terrorism", "natural_disaster", "biological", "political_unrest", "cyber", "humanitarian"],
    finance: ["market", "natural_disaster", "energy", "cyber"],
    military: ["war", "counter_terrorism", "natural_disaster", "biological", "cyber", "nuclear", "energy"],
  };

  const allowedCategories = profileCategoryMap[profile] || profileCategoryMap.osint;
  return events.filter((event) => allowedCategories.includes(event.category));
}

export function filterByCategory(events: Event[], category: string): Event[] {
  return events.filter((event) => event.category === category);
}
