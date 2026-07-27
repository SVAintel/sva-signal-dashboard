import { NextResponse } from "next/server";
import { CONFLICTS } from "@/lib/conflict-data";

const SHIPPING_LANES_URL =
  "https://raw.githubusercontent.com/newzealandpaul/Shipping-Lanes/main/data/Shipping_Lanes_v1.geojson";
const PORTS_URL =
  "https://data.harvestportal.org/dataset/45b504e2-9ae5-4c30-9125-b1d2ae301f05/resource/32f52965-1ae1-47a0-b1ad-45d1bf64093b/download/ports_of_the_world_wpi.geojson";
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

interface RouteFeature {
  name: string;
  points: [number, number][];
}

interface PortFeature {
  name: string;
  country: string;
  lat: number;
  lng: number;
  size: string;
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

      const size = String(p.HARBORSIZE || "").trim() || "Unknown";
      const name = String(p.PORT_NAME || "").trim() || "Unnamed Port";
      const country = String(p.COUNTRY || "").trim() || "Unknown";

      const sizeScore =
        size === "Large"
          ? 3
          : size === "Medium"
            ? 2
            : size === "Small"
              ? 1
              : 0;

      return { name, country, lat, lng, size, sizeScore };
    })
    .filter((x: any) => !!x)
    .sort((a: any, b: any) => b.sizeScore - a.sizeScore)
    .slice(0, 220)
    .map((p: any) => ({ name: p.name, country: p.country, lat: p.lat, lng: p.lng, size: p.size }));

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

    return NextResponse.json({ tradeRoutes, conflictZones, ports });
  } catch (error) {
    console.error("map-layers error:", error);
    return NextResponse.json({ tradeRoutes: [], conflictZones: [], ports: [] });
  }
}

