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

// Per-category weight for severity scoring — reflects how "alarming" a
// category is on its own, not how often it appears in the feed. Categories
// tied to mass-casualty/strategic risk (nuclear, biological) score highest;
// routine market/humanitarian coverage scores lowest. Tune freely — this is
// a simple weighted heuristic, not a calibrated model.
const CATEGORY_SEVERITY_WEIGHT: Record<string, number> = {
  nuclear: 5,
  biological: 5,
  counter_terrorism: 4,
  war: 3,
  cyber: 3,
  energy: 2,
  political_unrest: 2,
  natural_disaster: 2,
  humanitarian: 1,
  market: 1,
};

function categorySeverityWeight(category: string): number {
  return CATEGORY_SEVERITY_WEIGHT[category] ?? 1;
}

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
  severity: number; // 0-10ish composite score, higher = more urgent/notable
  summary?: string; // optional AI-generated one-line "why this matters", filled in by lib/correlation-ai.ts
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
    const latestAtMs = Math.max(...timestamps);

    // Severity blends three signals:
    //  1. Category weight — sum of *distinct* categories' individual weights,
    //     so a war+nuclear cluster outranks a market+humanitarian one.
    //  2. Recency — a cluster whose most recent signal just landed is more
    //     actionable than one whose last signal was 20+ hours ago (even if
    //     both are still inside the 24h clustering window).
    //  3. Density (diminishing returns) — more corroborating signals is a
    //     mild boost, via log so 20 members doesn't dwarf category/recency.
    const categoryScore = Array.from(categories).reduce((sum, c) => sum + categorySeverityWeight(c), 0);
    const hoursSinceLatest = (Date.now() - latestAtMs) / 3_600_000;
    const recencyScore = Math.max(0, 1 - hoursSinceLatest / CLUSTER_WINDOW_HOURS) * 3;
    const densityScore = Math.log2(members.length + 1);
    const severity = Math.round((categoryScore + recencyScore + densityScore) * 10) / 10;

    clusters.push({
      id: `${Math.round(centroidLat * 100)}-${Math.round(centroidLng * 100)}-${Math.min(...timestamps)}`,
      place: nearestPlaceName(centroidLat, centroidLng),
      centroid: { lat: centroidLat, lng: centroidLng },
      categories: Array.from(categories).sort(),
      memberCount: members.length,
      earliestAt: new Date(Math.min(...timestamps)).toISOString(),
      latestAt: new Date(latestAtMs).toISOString(),
      severity,
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

  // Most severe first — severity already blends category weight, recency,
  // and member density, so this replaces the old three-key manual sort.
  clusters.sort((a, b) => b.severity - a.severity);

  return clusters;
}
