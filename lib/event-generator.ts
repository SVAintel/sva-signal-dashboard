import { Event } from "@/lib/types";

// Mock event generation - replicating Python scraper logic in TypeScript
export async function generateMockEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let eventId = 1;

  // NewsAPI events (war/military)
  const newsEvents = [
    {
      title: "Military movements detected near border",
      description: "Reports of unconfirmed military activity",
      location: { lat: 50.08, lng: 14.44 },
      source: "NewsAPI",
      category: "war",
    },
    {
      title: "Terrorist organization claims responsibility",
      description: "Alleged attack linked to known extremist group",
      location: { lat: 48.86, lng: 2.35 },
      source: "NewsAPI",
      category: "counter_terrorism",
    },
  ];

  // Market events
  const marketEvents = [
    {
      title: "Unusual trading volume in Asian markets",
      description: "Spike in volatility detected on Tokyo and Hong Kong exchanges",
      location: { lat: 35.6762, lng: 139.6503 },
      source: "Bloomberg",
      category: "market",
    },
  ];

  // Geo/Disaster events
  const geoEvents = [
    {
      title: "Significant seismic activity recorded",
      description: "Magnitude 6.2 earthquake detected in Pacific Ring of Fire",
      location: { lat: 37.3382, lng: 141.0361 },
      source: "USGS",
      category: "natural_disaster",
    },
    {
      title: "Hurricane system developing",
      description: "Tropical storm expected to intensify into hurricane",
      location: { lat: 20.0, lng: -75.0 },
      source: "NOAA",
      category: "natural_disaster",
    },
  ];

  const allRawEvents = [...newsEvents, ...marketEvents, ...geoEvents];

  for (const rawEvent of allRawEvents) {
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    
    const knownKnownsMap: Record<string, string[]> = {
      war: ["Established military deployment pattern"],
      counter_terrorism: ["Organization fingerprints detected"],
      natural_disaster: ["Geological patterns align with historical data"],
      market: ["Policy signals align with economic theory"],
    };

    const knownUnknownsMap: Record<string, string[]> = {
      war: ["Intent of force deployment unclear", "Casualty estimates highly uncertain"],
      counter_terrorism: ["Exact target and timeline unclear", "Potential accomplices not yet identified"],
      natural_disaster: ["Secondary effects unpredictable", "Humanitarian impact still being assessed"],
      market: ["Exact magnitude of policy impact uncertain", "Spillover effects into other sectors unclear"],
    };

    const unknownUnknownsMap: Record<string, string[]> = {
      war: ["Unexpected alliance shifts", "Undisclosed weapons deployments"],
      counter_terrorism: ["Cyber component to attack", "Supply chain compromises"],
      natural_disaster: ["Cascading infrastructure failures", "Unexpected climate feedback loops"],
      market: ["Black swan financial instrument discovery", "Regulatory surprises"],
    };

    const category = rawEvent.category as keyof typeof knownKnownsMap;

    const event: Event = {
      id: `evt-${String(eventId++).padStart(3, "0")}`,
      title: rawEvent.title,
      description: rawEvent.description,
      category: rawEvent.category,
      location: rawEvent.location,
      source: rawEvent.source,
      timestamp: timestamp.toISOString(),
      aiNotes: knownKnownsMap[category]?.[0] || "Event under analysis",
      confidence: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
    };

    events.push(event);
  }

  return events;
}

// Determine which profiles can see each event
export function filterByProfile(events: Event[], profile: string): Event[] {
  const profileCategoryMap: Record<string, string[]> = {
    osint: ["war", "counter_terrorism", "natural_disaster"],
    finance: ["market", "natural_disaster"],
    military: ["war", "counter_terrorism", "natural_disaster"],
  };

  const allowedCategories = profileCategoryMap[profile] || profileCategoryMap.osint;
  return events.filter((event) => allowedCategories.includes(event.category));
}

// Filter by category
export function filterByCategory(events: Event[], category: string): Event[] {
  return events.filter((event) => event.category === category);
}
