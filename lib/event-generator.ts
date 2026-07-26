import { Event } from "@/lib/types";

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Fetch events from all real APIs
export async function generateMockEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let eventId = 1;

  try {
    // Fetch from real APIs in parallel
    const [newsEvents, marketEvents, geoEvents, gdeltEvents] = await Promise.all([
      fetchNewsAPIEvents(),
      fetchAlphaVantageEvents(),
      fetchUSGSEvents(),
      fetchGDELTEvents(),
    ]);

    const allEvents = [...newsEvents, ...marketEvents, ...geoEvents, ...gdeltEvents];

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

  return events;
}

// NewsAPI - geopolitical events
async function fetchNewsAPIEvents() {
  if (!NEWS_API_KEY) return [];
  try {
    const keywords = ["military", "war", "conflict", "terrorist", "attack", "security"];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${keyword}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`
    );
    const data = await res.json();
    
    return (data.articles || []).slice(0, 5).map((article: any) => ({
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

// Alpha Vantage - market events
async function fetchAlphaVantageEvents() {
  if (!ALPHA_VANTAGE_KEY) return [];
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_KEY}`
    );
    const data = await res.json();
    
    if (data["Global Quote"]) {
      const quote = data["Global Quote"];
      const change = parseFloat(quote["09. change"] || "0");
      return [{
        title: `Market Signal: ${change > 0 ? "Bullish" : "Bearish"} pressure detected`,
        description: `Global markets showing ${Math.abs(change)}% movement. Tech sector (AAPL) at $${quote["05. price"]}`,
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
    const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson");
    const data = await res.json();
    
    return (data.features || []).slice(0, 3).map((feature: any) => {
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
    const res = await fetch("https://api.gdeltproject.org/api/v2/search?query=conflict&mode=artlist&maxrecords=5&format=json");
    const data = await res.json();
    
    return (data.articles || []).slice(0, 5).map((article: any) => ({
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
