// Pattern-detection / correlation engine: groups recently-seen signals
// (from event_snapshots, already geo-tagged + categorized) into geographic +
// temporal clusters, and flags clusters that span 2+ distinct categories as
// "correlated" — i.e. worth a human's attention because multiple different
// kinds of signal are converging on the same place around the same time
// (e.g. a WAR story + a MARKET signal + a GEO/naval movement all near the
// Black Sea within a day of each other).
//
// Deliberately rule-based (distance + time-window + category-diversity),
// not ML — simple, explainable, and tunable by adjusting the two constants
// below once real output can be observed. No new external data source is
// needed: this runs entirely against data already being collected by the
// existing /api/events cron-backed history.
import type { EventHistoryRow } from "@/lib/db";
import { haversineDistanceKm } from "@/lib/geo";
import { nearestPlaceName } from "@/lib/event-generator";

// Two events are considered "linked" (same cluster) when they're within both
// of these thresholds of each other. Loose enough to catch e.g. a naval
// movement near a coastal city and a war story about that same city, tight
// enough not to lump together unrelated things happening on opposite sides
// of a continent.
const CLUSTER_DISTANCE_KM = 300;
const CLUSTER_WINDOW_HOURS = 24;

export interface CorrelationClusterMember {
  title: string;
  category: string;
  source: string;
  url: string | null;
  lat: number;
  lng: number;
  timestamp: string; // event_timestamp if present, else firstSeenAt
}

export interface CorrelationCluster {
  id: string;
  place: string; // human-readable label, e.g. "Odessa"
  centroid: { lat: number; lng: number };
  categories: string[]; // distinct categories involved, sorted
  memberCount: number;
  earliestAt: string;
  latestAt: string;
  members: CorrelationClusterMember[];
}

function toTimestamp(row: EventHistoryRow): string {
  return row.eventTimestamp || row.firstSeenAt;
}

// Union-Find (disjoint-set) so clusters can grow transitively — if A links
// to B and B links to C, all three end up in one cluster even if A and C
// themselves are just outside the distance/time thresholds directly.
class UnionFind {
  private parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

export function buildCorrelationClusters(rows: EventHistoryRow[]): CorrelationCluster[] {
  const n = rows.length;
  if (n === 0) return [];

  const times = rows.map((r) => new Date(toTimestamp(r)).getTime());
  const uf = new UnionFind(n);

  // O(n^2) pairwise comparison — history is capped at 500 rows by
  // getRecentEvents(), so this is a few hundred-thousand comparisons at
  // worst, well within a single serverless invocation's budget.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const hoursApart = Math.abs(times[i] - times[j]) / 3_600_000;
      if (hoursApart > CLUSTER_WINDOW_HOURS) continue;
      const distanceKm = haversineDistanceKm(
        { lat: rows[i].lat, lng: rows[i].lng },
        { lat: rows[j].lat, lng: rows[j].lng }
      );
      if (distanceKm > CLUSTER_DISTANCE_KM) continue;
      uf.union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const clusters: CorrelationCluster[] = [];
  for (const indices of groups.values()) {
    const categories = new Set(indices.map((i) => rows[i].category));
    // The whole point of "pattern alerts" is surfacing cross-category
    // convergence — a cluster of 10 stories all tagged "war" about the same
    // battle is just one story reported many times, not a pattern.
    if (categories.size < 2) continue;

    const members = indices
      .map((i) => rows[i])
      .sort((a, b) => new Date(toTimestamp(b)).getTime() - new Date(toTimestamp(a)).getTime());

    const centroidLat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
    const centroidLng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;
    const timestamps = members.map((m) => new Date(toTimestamp(m)).getTime());

    clusters.push({
      id: `${Math.round(centroidLat * 100)}-${Math.round(centroidLng * 100)}-${Math.min(...timestamps)}`,
      place: nearestPlaceName(centroidLat, centroidLng),
      centroid: { lat: centroidLat, lng: centroidLng },
      categories: Array.from(categories).sort(),
      memberCount: members.length,
      earliestAt: new Date(Math.min(...timestamps)).toISOString(),
      latestAt: new Date(Math.max(...timestamps)).toISOString(),
      members: members.map((m) => ({
        title: m.title,
        category: m.category,
        source: m.source,
        url: m.url,
        lat: m.lat,
        lng: m.lng,
        timestamp: toTimestamp(m),
      })),
    });
  }

  // Most significant first: more categories involved, then more members,
  // then most recent.
  clusters.sort((a, b) => {
    if (b.categories.length !== a.categories.length) return b.categories.length - a.categories.length;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
  });

  return clusters;
}
