export interface Event {
  id: string;
  title: string;
  category: string;
  location: { lat: number; lng: number };
  source: string;
  url?: string;
  timestamp: string;
  description: string;
  aiNotes: string;
  confidence: string;
}

export type VerificationFilter = "all" | "confirmed" | "unconfirmed";

// Telegram is scraped OSINT/war-monitor chatter, not a vetted news source —
// treat it as "unconfirmed". Every other source (wire APIs, RSS outlets,
// ACLED, GDELT, USGS/EMSC, etc.) is treated as "confirmed".
export function isUnconfirmedSource(source: string): boolean {
  return source.startsWith("Telegram");
}
