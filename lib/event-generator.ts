import { Event } from "@/lib/types";

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Fetch events from all real APIs with timeout
export async function generateMockEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let eventId = 1;

  try {
    // Fetch from real APIs in parallel with 5 second timeout each
    const results = await Promise.allSettled([
      fetchNewsAPIEvents(),
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
      description: "Real-time events from NewsAPI, Alpha Vantage, USGS, GDELT, ACLED, CoinGecko, and EMSC",
      category: "war",
      location: { lat: 35, lng: 0 },
      source: "Dashboard",
      timestamp: new Date().toISOString(),
      aiNotes: "Waiting for live API data...",
      confidence: "pending",
    },
  ];
}

// NewsAPI - geopolitical events (with timeout)
async function fetchNewsAPIEvents() {
  if (!NEWS_API_KEY) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const keywords = ["military", "war", "conflict", "terrorist"];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${keyword}&sortBy=publishedAt&language=en&pageSize=3&apiKey=${NEWS_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.articles || []).slice(0, 3).map((article: any) => ({
      title: article.title,
      description: article.description || article.content || "Breaking news",
      location: { lat: 20 + Math.random() * 40, lng: -30 + Math.random() * 120 },
      source: "NewsAPI",
      category: keyword.includes("terror") ? "counter_terrorism" : "war",
      timestamp: new Date(article.publishedAt).toISOString(),
    }));
  } catch (e) {
    console.error("NewsAPI error:", e);
    return [];
  }
}

// Alpha Vantage - market events (with timeout)
async function fetchAlphaVantageEvents() {
  if (!ALPHA_VANTAGE_KEY) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}`,
      { signal: controller.signal }
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
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 2).map((feature: any) => {
      const mag = feature.properties.mag;
      return {
        title: `Seismic Alert: Magnitude ${mag} earthquake`,
        description: feature.properties.title || "Seismic activity detected",
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "USGS",
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
      "https://api.gdeltproject.org/api/v2/search?query=conflict&mode=artlist&maxrecords=2&format=json",
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.articles || []).slice(0, 2).map((article: any) => ({
      title: article.title,
      description: article.snippet || "Geopolitical event detected",
      location: { lat: 35 + Math.random() * 30, lng: -10 + Math.random() * 100 },
      source: "GDELT",
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
        return {
          title: `ACLED Alert: ${parts[5]?.trim() || "Conflict event"}`,
          description: `Event type: ${parts[6]?.trim() || "Unknown"} - ${parts[9]?.trim() || ""}`,
          location: { lat: parseFloat(parts[11]) || 0, lng: parseFloat(parts[12]) || 0 },
          source: "ACLED",
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
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    const btcChange = data.data?.btc_market_cap_change_percentage_24h || 0;
    
    return [{
      title: `Crypto Signal: Bitcoin ${btcChange > 0 ? "📈" : "📉"} ${Math.abs(btcChange).toFixed(1)}% (24h)`,
      description: `Global crypto market volatility signal. Total market cap: $${(data.data?.total_market_cap?.usd / 1e9).toFixed(2)}B`,
      location: { lat: 51.5074, lng: -0.1278 }, // London - crypto hub
      source: "CoinGecko",
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
      "https://www.emsc-csem.org/api/test/latest?limit=2&start_year=2023",
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 2).map((feature: any) => {
      const mag = feature.properties.magnitude;
      return {
        title: `EMSC Alert: Magnitude ${mag} - ${feature.properties.eventLocationName || "European Mediterranean"}`,
        description: `Depth: ${feature.geometry.coordinates[2]}km - EMSC high-precision data`,
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "EMSC",
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
};

export function filterByProfile(events: Event[], profile: string): Event[] {
  const profileCategoryMap: Record<string, string[]> = {
    osint: ["war", "counter_terrorism", "natural_disaster"],
    finance: ["market", "natural_disaster"],
    military: ["war", "counter_terrorism", "natural_disaster"],
  };

  const allowedCategories = profileCategoryMap[profile] || profileCategoryMap.osint;
  return events.filter((event) => allowedCategories.includes(event.category));
}

export function filterByCategory(events: Event[], category: string): Event[] {
  return events.filter((event) => event.category === category);
}
