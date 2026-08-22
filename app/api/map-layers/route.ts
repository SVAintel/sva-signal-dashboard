import { NextResponse } from "next/server";
import { CONFLICTS } from "@/lib/conflict-data";
import cablesData from "@/lib/data/cables.json";
import pipelinesData from "@/lib/data/pipelines.json";
import militaryBasesData from "@/lib/data/military-bases.json";
import { MILITARY_BASE_DETAILS, type MilitaryBaseDetail } from "@/lib/data/military-base-details";
import { PORT_DETAILS, type PortDetail } from "@/lib/data/port-details";

// Underlying datasets already carry long revalidate windows (6h/12h/7d) below.
// This route has no dynamic API usage of its own though, so without
// force-dynamic Next.js treats it as a STATIC route handler baked in at build
// time and relies entirely on ISR background revalidation to refresh — which
// hasn't been reliably triggering in production. force-dynamic makes the
// handler run per-request while the inner fetches keep their own cache windows.
export const dynamic = "force-dynamic";
export const revalidate = 21600;

const SHIPPING_LANES_URL =
  "https://raw.githubusercontent.com/newzealandpaul/Shipping-Lanes/main/data/Shipping_Lanes_v1.geojson";
const PORTS_URL =
  "https://data.harvestportal.org/dataset/45b504e2-9ae5-4c30-9125-b1d2ae301f05/resource/32f52965-1ae1-47a0-b1ad-45d1bf64093b/download/ports_of_the_world_wpi.geojson";
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
// Submarine cables and oil/gas pipelines are physical infrastructure that
// essentially never changes route day-to-day, so both are bundled as static
// snapshots (lib/data/*.json, built by scripts/fetch-infra-data.mjs) rather
// than fetched live on every request — no runtime dependency on an external
// repo's uptime (cables) or Overpass's rate limits (pipelines).

interface RouteFeature {
  name: string;
  points: [number, number][];
}

interface PortFeature {
  name: string;
  displayName: string;
  country: string;
  lat: number;
  lng: number;
  size: string;
  isMajor: boolean;
  details?: PortDetail;
}

interface CableFeature {
  id: string;
  name: string;
  paths: [number, number][][];
}

interface PipelineFeature {
  id: string;
  name: string;
  substance: "oil" | "gas";
  paths: [number, number][][];
}

interface MilitaryBaseFeature {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  operator: string | null;
  isMajor: boolean;
  details?: MilitaryBaseDetail;
}

interface ConflictZoneOutput {
  id: string;
  name: string;
  countries: string[];
  actors: string[];
  description: string;
  casualties: string;
  startYear: number;
  intensity: "high" | "medium" | "low";
  sources: string[];
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}

function downsample(points: [number, number][], maxPoints: number): [number, number][] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, idx) => idx % step === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

function parseShippingRoutes(geojson: any): RouteFeature[] {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  const routes: RouteFeature[] = [];

  for (const f of features) {
    const geom = f?.geometry;
    if (!geom) continue;
    const routeClass = String(f?.properties?.Type || "").trim() || "Route";

    if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
      const points = geom.coordinates
        .map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number])
        .filter((p: [number, number]) => !isNaN(p[0]) && !isNaN(p[1]));
      if (points.length >= 2) {
        routes.push({ name: `${routeClass} Route ${routes.length + 1}`, points: downsample(points, 22) });
      }
      continue;
    }

    // MultiLineString: every segment is a distinct shipping lane — keep them all,
    // not just the longest one, otherwise we drop the vast majority of real routes.
    if (geom.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
      for (const line of geom.coordinates) {
        const points = (line as number[][])
          .map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number])
          .filter((p: [number, number]) => !isNaN(p[0]) && !isNaN(p[1]));
        if (points.length < 2) continue;
        routes.push({ name: `${routeClass} Route ${routes.length + 1}`, points: downsample(points, 18) });
      }
    }
  }

  // Cap total rendered routes for performance while keeping broad geographic coverage.
  return routes.slice(0, 260);
}

// WPI's HARBORSIZE field uses single-letter codes (L/M/S/V), not the
// "Large"/"Medium"/"Small" words the size-ranking logic below previously
// compared against — that mismatch meant every port scored 0 and the
// "top 220 by size" slice was really just the first 220 in file order,
// silently dropping major ports like Singapore/Jebel Ali in favor of
// whatever tiny harbor happened to be listed first.
const HARBOR_SIZE_LABELS: Record<string, string> = {
  L: "Large",
  M: "Medium",
  S: "Small",
  V: "Very Small",
};

// Facility names in the WPI feed are UPPERCASE and often obscure sub-harbor
// names (e.g. "KEPPEL - (EAST SINGAPORE)", "MINA JABAL ALI") rather than the
// familiar city name. Title-case as a readable fallback; curated entries in
// PORT_DETAILS override this with a friendlier `displayName`.
function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parsePorts(geojson: any): PortFeature[] {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  const scored = features
    .map((f: any) => {
      const p = f?.properties || {};
      const coords = f?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;

      const lat = Number(coords[1]);
      const lng = Number(coords[0]);
      if (isNaN(lat) || isNaN(lng)) return null;

      const sizeCode = String(p.HARBORSIZE || "").trim().toUpperCase();
      const size = HARBOR_SIZE_LABELS[sizeCode] || "Unknown";
      const name = String(p.PORT_NAME || "").trim() || "Unnamed Port";
      const country = String(p.COUNTRY || "").trim() || "Unknown";

      const sizeScore = sizeCode === "L" ? 3 : sizeCode === "M" ? 2 : sizeCode === "S" ? 1 : 0;

      return { name, country, lat, lng, size, sizeScore };
    })
    .filter((x: any) => !!x)
    .sort((a: any, b: any) => b.sizeScore - a.sizeScore)
    .slice(0, 220)
    .map((p: any) => {
      const details = PORT_DETAILS[p.name];
      return {
        name: p.name,
        displayName: details?.displayName || titleCase(p.name),
        country: p.country,
        lat: p.lat,
        lng: p.lng,
        size: p.size,
        // Only the hand-curated ports (chokepoints, top container/cargo hubs)
        // count as "major" — mirrors the isMajor = Boolean(details) pattern
        // used for military bases, so the map layer can offer the same
        // All/Major/Minor filter UX.
        isMajor: Boolean(details),
        details,
      };
    });

  return scored;
}

function buildConflictZones(countriesGeojson: any): ConflictZoneOutput[] {
  const features = Array.isArray(countriesGeojson?.features) ? countriesGeojson.features : [];
  const byName = new Map<string, any>();
  for (const f of features) {
    const name = f?.properties?.name;
    if (name) byName.set(name, f.geometry);
  }

  const zones: ConflictZoneOutput[] = [];
  for (const conflict of CONFLICTS) {
    // Merge every matched country's polygon rings into one MultiPolygon so the
    // whole conflict renders as a single outlined zone with shared metadata.
    const polygons: number[][][][] = [];
    for (const countryName of conflict.countries) {
      const geom = byName.get(countryName);
      if (!geom) continue;
      if (geom.type === "Polygon") polygons.push(geom.coordinates);
      else if (geom.type === "MultiPolygon") polygons.push(...geom.coordinates);
    }
    if (polygons.length === 0) continue;

    zones.push({
      id: conflict.id,
      name: conflict.name,
      countries: conflict.countries,
      actors: conflict.actors,
      description: conflict.description,
      casualties: conflict.casualties,
      startYear: conflict.startYear,
      intensity: conflict.intensity,
      sources: conflict.sources,
      geometry: { type: "MultiPolygon", coordinates: polygons },
    });
  }

  return zones;
}

export async function GET() {
  try {
    const [shippingRes, portsRes, countriesRes] = await Promise.all([
      fetch(SHIPPING_LANES_URL, { next: { revalidate: 21600 } }), // 6h
      fetch(PORTS_URL, { next: { revalidate: 43200 } }), // 12h
      fetch(COUNTRIES_URL, { next: { revalidate: 604800 } }), // 7d — borders rarely change
    ]);

    const shippingData = shippingRes.ok ? await shippingRes.json() : null;
    const portsData = portsRes.ok ? await portsRes.json() : null;
    const countriesData = countriesRes.ok ? await countriesRes.json() : null;

    const tradeRoutes = shippingData ? parseShippingRoutes(shippingData) : [];
    const ports = portsData ? parsePorts(portsData) : [];
    const conflictZones = countriesData ? buildConflictZones(countriesData) : [];
    // Cables, pipelines, and military bases are pre-parsed static snapshots — no live fetch.
    const cables = cablesData as CableFeature[];
    const pipelines = pipelinesData as PipelineFeature[];
    const militaryBases = (militaryBasesData as Omit<MilitaryBaseFeature, "isMajor" | "details">[]).map((base) => {
      const details = MILITARY_BASE_DETAILS[base.id];
      return { ...base, country: details?.country ?? base.country, isMajor: Boolean(details), details };
    });

    return NextResponse.json({ tradeRoutes, conflictZones, ports, cables, pipelines, militaryBases });
  } catch (error) {
    console.error("map-layers error:", error);
    return NextResponse.json({ tradeRoutes: [], conflictZones: [], ports: [], cables: [], pipelines: [], militaryBases: [] });
  }
}

