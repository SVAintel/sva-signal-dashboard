export interface Event {
  id: string;
  sourceEventId?: string;
  title: string;
  category: string;
  // Additional categories this event also plausibly belongs to (e.g. a
  // cyberattack that knocked out a power grid during a war would be
  // category: "war", secondaryCategories: ["cyber", "energy"]). Optional —
  // most events only score meaningfully in one category. Populated by
  // categorizeNewsText() in lib/event-generator.ts.
  secondaryCategories?: string[];
  location: { lat: number; lng: number };
  source: string;
  url?: string;
  timestamp: string;
  description: string;
  aiNotes: string;
  confidence: string;
  provenance?: ReportCollection[];
  article?: {
    identity: "url-headline" | "attributed-syndication" | "publisher-text" | "collection" | "structured";
    canonicalUrl?: string;
    publisherKey?: string;
    publisherLabel?: string;
    aliases?: string[];
  };
}

export interface ReportCollection extends Omit<Event, "provenance" | "article"> {
  provider: string;
  publisher?: string;
}

export type VerificationFilter = "all" | "confirmed" | "unconfirmed";

// Telegram is scraped OSINT/war-monitor chatter, not a vetted news source —
// treat it as "unconfirmed". Every other source (wire APIs, RSS outlets,
// ACLED, GDELT, USGS/EMSC, etc.) is treated as "confirmed".
export function isUnconfirmedSource(source: string): boolean {
  return source.startsWith("Telegram");
}
