import { NextResponse } from "next/server";
import { generateMockEvents } from "@/lib/event-generator";

const SHIPPING_LANES_URL =
  "https://raw.githubusercontent.com/newzealandpaul/Shipping-Lanes/main/data/Shipping_Lanes_v1.geojson";
const PORTS_URL =
  "https://data.harvestportal.org/dataset/45b504e2-9ae5-4c30-9125-b1d2ae301f05/resource/32f52965-1ae1-47a0-b1ad-45d1bf64093b/download/ports_of_the_world_wpi.geojson";

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

interface ConflictZone {
  name: string;
  center: [number, number];
  radiusKm: number;
  intensity: number;
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
  const features = Array.isArray(geojson?.features) ? geojson.features.slice(0, 140) : [];

  return features
    .map((f: any, idx: number) => {
      const geom = f?.geometry;
      if (!geom) return null;

      if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
        const points = geom.coordinates
          .map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number])
          .filter((p: [number, number]) => !isNaN(p[0]) && !isNaN(p[1]));
        if (points.length < 2) return null;
        return { name: `Trade Route ${idx + 1}`, points: downsample(points, 22) };
      }

      if (geom.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
        const bestLine = geom.coordinates
          .map((line: number[][]) =>
            line
              .map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number])
              .filter((p: [number, number]) => !isNaN(p[0]) && !isNaN(p[1]))
          )
          .sort((a: [number, number][], b: [number, number][]) => b.length - a.length)[0];

        if (!bestLine || bestLine.length < 2) return null;
        return { name: `Trade Route ${idx + 1}`, points: downsample(bestLine, 22) };
      }

      return null;
    })
    .filter((r: RouteFeature | null): r is RouteFeature => !!r);
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

function buildConflictZones(events: Awaited<ReturnType<typeof generateMockEvents>>): ConflictZone[] {
  const conflict = events.filter((e) =>
    ["war", "counter_terrorism", "political_unrest"].includes(e.category)
  );

  const bins: Record<string, { lat: number; lng: number; count: number }> = {};
  for (const e of conflict) {
    const latBin = Math.round(e.location.lat / 8) * 8;
    const lngBin = Math.round(e.location.lng / 8) * 8;
    const key = `${latBin}:${lngBin}`;
    if (!bins[key]) bins[key] = { lat: latBin, lng: lngBin, count: 0 };
    bins[key].count += 1;
  }

  return Object.values(bins)
    .filter((b) => b.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((b, idx) => ({
      name: `Conflict Zone ${idx + 1}`,
      center: [b.lat, b.lng] as [number, number],
      radiusKm: Math.min(380, 120 + b.count * 45),
      intensity: b.count,
    }));
}

export async function GET() {
  try {
    const [shippingRes, portsRes, events] = await Promise.all([
      fetch(SHIPPING_LANES_URL, { next: { revalidate: 21600 } }), // 6h
      fetch(PORTS_URL, { next: { revalidate: 43200 } }), // 12h
      generateMockEvents(),
    ]);

    const shippingData = shippingRes.ok ? await shippingRes.json() : null;
    const portsData = portsRes.ok ? await portsRes.json() : null;

    const tradeRoutes = shippingData ? parseShippingRoutes(shippingData) : [];
    const ports = portsData ? parsePorts(portsData) : [];
    const conflictZones = buildConflictZones(events);

    return NextResponse.json({ tradeRoutes, conflictZones, ports });
  } catch (error) {
    console.error("map-layers error:", error);
    return NextResponse.json({ tradeRoutes: [], conflictZones: [], ports: [] });
  }
}

