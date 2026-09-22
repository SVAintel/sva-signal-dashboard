import type { Event, ReportCollection } from "./types";
import { processSignalFeed, reportCollections } from "./signal-pipeline";

export interface EventHistoryRow {
  title: string;
  category: string;
  secondaryCategories: string[];
  lat: number;
  lng: number;
  source: string;
  url: string | null;
  description: string | null;
  eventTimestamp: string | null;
  firstSeenAt: string;
  id?: string;
  provenance?: ReportCollection[];
}

export function normalizeEventHistory(rows: readonly EventHistoryRow[]): EventHistoryRow[] {
  const firstSeen = new Map<string, string>();
  const input: Event[] = rows.map(row => {
    const event: Event = {
      id: row.id || "", title: row.title, category: row.category, secondaryCategories: row.secondaryCategories,
      location: { lat: row.lat, lng: row.lng }, source: row.source, url: row.url || undefined,
      description: row.description || "", timestamp: row.eventTimestamp || "", confidence: "", aiNotes: "",
      provenance: row.provenance,
    };
    for (const record of reportCollections(event)) {
      const previous = firstSeen.get(record.id);
      if (!previous || Date.parse(row.firstSeenAt) < Date.parse(previous)) firstSeen.set(record.id, row.firstSeenAt);
    }
    return event;
  });
  return processSignalFeed(input, false).events.map(event => ({
    id: event.id, title: event.title, category: event.category, secondaryCategories: event.secondaryCategories || [],
    lat: event.location.lat, lng: event.location.lng, source: event.source, url: event.url || null,
    description: event.description, eventTimestamp: event.timestamp || null, provenance: event.provenance,
    firstSeenAt: reportCollections(event).map(record => firstSeen.get(record.id)!).filter(Boolean)
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0],
  }));
}
