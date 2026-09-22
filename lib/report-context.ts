import type { Event } from "./types";
import { haversineDistanceKm } from "./geo";

export const CONTEXT_WINDOW_HOURS = 24;
export const CONTEXT_DISTANCE_KM = 300;
export const RELATED_LIMIT = 8;
export const SOURCE_LIMIT = 12;
export type Relation = "all" | "source" | "category" | "nearby";
export interface RelatedReport {
  event: Event;
  sameSource: boolean;
  sameCategory: boolean;
  distanceKm: number | null;
  hoursApart: number;
}

const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sourceKey = (value: string) => value.trim().toLowerCase();
export const validReportTime = (event: Event) => Number.isFinite(Date.parse(event.timestamp));
export const validCoordinates = (point: Event["location"] | undefined) => !!point &&
  Number.isFinite(point.lat) && Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;

export function articleUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

// Resolve duplicate IDs consistently even when upstream ordering changes.
export function uniqueReports(events: readonly Event[]): Event[] {
  const sorted = events.filter((event) => event.id.trim() && validReportTime(event)).slice().sort((a, b) =>
    Date.parse(b.timestamp) - Date.parse(a.timestamp) ||
    compareText(JSON.stringify(a), JSON.stringify(b)));
  const seen = new Set<string>();
  return sorted.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

export function resolveReport(snapshot: Event, loaded: readonly Event[]): { event: Event; retained: boolean } {
  const matches = (event: Event) => event.id === snapshot.id || event.article?.aliases?.includes(snapshot.id);
  const latest = uniqueReports(loaded).find(matches) ||
    loaded.filter(matches).slice().sort((a, b) => compareText(JSON.stringify(a), JSON.stringify(b)))[0];
  return { event: latest || snapshot, retained: !latest };
}

export function relatedReports(parent: Event, scopedEvents: readonly Event[], relation: Relation = "all") {
  if (!validReportTime(parent)) return { reports: [] as RelatedReport[], total: 0 };
  const matches: RelatedReport[] = [];
  for (const event of uniqueReports(scopedEvents)) {
    if (event.id === parent.id || !validCoordinates(event.location)) continue;
    const hoursApart = Math.abs(Date.parse(event.timestamp) - Date.parse(parent.timestamp)) / 3600000;
    if (hoursApart > CONTEXT_WINDOW_HOURS) continue;
    const sameSource = !!sourceKey(parent.source) && sourceKey(event.source) === sourceKey(parent.source);
    const sameCategory = !!parent.category && parent.category !== "general" && event.category === parent.category;
    const distance = validCoordinates(parent.location) && validCoordinates(event.location)
      ? haversineDistanceKm(parent.location, event.location) : null;
    const distanceKm = distance !== null && distance <= CONTEXT_DISTANCE_KM ? distance : null;
    if (!(sameSource || sameCategory || distanceKm !== null)) continue;
    if (relation === "source" && !sameSource || relation === "category" && !sameCategory || relation === "nearby" && distanceKm === null) continue;
    matches.push({ event, sameSource, sameCategory, distanceKm, hoursApart });
  }
  const strength = (item: RelatedReport) => Number(item.sameSource) + Number(item.sameCategory) + Number(item.distanceKm !== null);
  matches.sort((a, b) => strength(b) - strength(a) ||
    Number(b.distanceKm !== null) - Number(a.distanceKm !== null) ||
    a.hoursApart - b.hoursApart || Date.parse(b.event.timestamp) - Date.parse(a.event.timestamp) ||
    compareText(a.event.id, b.event.id));
  return { reports: matches.slice(0, RELATED_LIMIT), total: matches.length };
}

export function sourceReports(parent: Event, scopedEvents: readonly Event[]) {
  const matches = uniqueReports(scopedEvents).filter((event) => event.id !== parent.id && validCoordinates(event.location) &&
    !!sourceKey(parent.source) && sourceKey(event.source) === sourceKey(parent.source));
  return { reports: matches.slice(0, SOURCE_LIMIT), total: matches.length };
}
