import type { EventHistoryRow, FleetHistoryRow } from "@/lib/db";

// Matches historical events/fleet snapshots to a named region (country or
// named sea/operating area) by simple keyword containment in either
// direction. Deliberately loose/textual rather than a strict geo-fence,
// since named sea regions (e.g. "Red Sea") don't correspond to any single
// country polygon and events don't carry a region label of their own.
// Shared by /api/region-brief (weekly brief synthesis) and /api/chat
// (country Q&A context) so both stay in sync on how "recent activity here"
// is defined.
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function matchesRegion(text: string, regionName: string, aliases: string[] = []): boolean {
  const t = normalize(text);
  const candidates = [regionName, ...aliases].map(normalize).filter(Boolean);
  return candidates.some((c) => c.length > 2 && t.includes(c));
}

export function eventsForRegion(
  events: EventHistoryRow[],
  regionName: string,
  aliases: string[] = []
): EventHistoryRow[] {
  return events.filter((e) => matchesRegion(`${e.title} ${e.description ?? ""}`, regionName, aliases));
}

export function fleetForRegion(
  fleets: FleetHistoryRow[],
  regionName: string,
  aliases: string[] = []
): FleetHistoryRow[] {
  const norm = normalize(regionName);
  return fleets.filter((f) => {
    const region = normalize(f.region);
    if (region.includes(norm) || norm.includes(region)) return true;
    return aliases.some((a) => region.includes(normalize(a)));
  });
}
