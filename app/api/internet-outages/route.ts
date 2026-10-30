import { NextResponse } from "next/server";

// IODA (Internet Outage Detection and Analysis), Georgia Tech. Free, no API
// key. Detects country-level connectivity drops by comparing live BGP/active-
// probing/darknet signal against each country's own historical baseline —
// not a single ISP's view, so it catches cable cuts, shutdowns, and censorship
// events alike.
const IODA_URL = "https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts";
// IODA keys alerts by ISO alpha-2 country code with no coordinates attached.
// The repo's existing country polygons (johan/world.geo.json, used for
// conflict zones) are alpha-3 only and have no ready centroid, so this
// GitHub-hosted dataset — alpha-2 codes plus a precomputed [lat, lng] per
// country — is fetched separately and cached long-lived (centroids never move).
const COUNTRIES_URL = "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";

// Alerts are bucketed roughly hourly; 15 min keeps the layer timely without
// hammering IODA. force-dynamic is required for the same reason as the other
// map-layer routes: the handler does its own fetch-level caching, so Next
// must still invoke it per-request rather than treating it as fully static.
export const dynamic = "force-dynamic";
export const revalidate = 900;

interface CountryOutage {
  code: string;
  name: string;
  lat: number;
  lng: number;
  level: "warning" | "critical";
  datasource: string;
  time: number;
  radiusMeters: number;
}

// True-scale footprint like the GPS-jamming layer's H3 circles, but sized to
// the country rather than a fixed hex: area-equivalent-circle radius, clamped
// so city-states remain visible and Russia-sized countries don't blanket the
// map. mledoze's `area` field is km².
const MIN_RADIUS_METERS = 60_000;
const MAX_RADIUS_METERS = 900_000;
function areaToRadiusMeters(areaKm2: number | undefined): number {
  const area = typeof areaKm2 === "number" && areaKm2 > 0 ? areaKm2 : 0;
  const radiusMeters = Math.sqrt(area / Math.PI) * 1000;
  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, radiusMeters));
}

let centroidCache: { map: Map<string, { lat: number; lng: number; name: string; radiusMeters: number }>; expires: number } | null = null;

async function getCountryCentroids(): Promise<Map<string, { lat: number; lng: number; name: string; radiusMeters: number }>> {
  if (centroidCache && centroidCache.expires > Date.now()) return centroidCache.map;
  const map = new Map<string, { lat: number; lng: number; name: string; radiusMeters: number }>();
  try {
    const res = await fetch(COUNTRIES_URL, { next: { revalidate: 86400 } });
    if (res.ok) {
      const list = await res.json();
      for (const entry of Array.isArray(list) ? list : []) {
        const latlng = entry?.latlng;
        const code = entry?.cca2;
        if (typeof code === "string" && Array.isArray(latlng) && latlng.length === 2) {
          const [lat, lng] = latlng;
          if (typeof lat === "number" && typeof lng === "number") {
            map.set(code.toUpperCase(), {
              lat,
              lng,
              name: entry?.name?.common || code,
              radiusMeters: areaToRadiusMeters(entry?.area),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("internet-outages country centroid fetch error:", error);
  }
  // Cache even an empty map briefly so a transient failure doesn't retry on
  // every single request within the same revalidate window.
  centroidCache = { map, expires: Date.now() + (map.size > 0 ? 86400000 : 900000) };
  return map;
}

export async function GET() {
  try {
    const centroids = await getCountryCentroids();
    const until = Math.floor(Date.now() / 1000);
    const from = until - 24 * 3600;
    const res = await fetch(
      `${IODA_URL}?from=${from}&until=${until}&entityType=country&limit=500`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) {
      return NextResponse.json({ outages: [], note: `IODA fetch failed: ${res.status}` });
    }
    const payload = await res.json();
    const alerts = Array.isArray(payload?.data) ? payload.data : [];

    // Collapse to one entry per country: keep the most severe, most recent
    // non-"normal" alert so a country doesn't show both a "critical" marker
    // and a stale "warning" marker at once.
    const byCountry = new Map<string, CountryOutage>();
    for (const alert of alerts) {
      const level = alert?.level;
      if (level !== "warning" && level !== "critical") continue;
      const code = String(alert?.entity?.code || "").toUpperCase();
      const centroid = centroids.get(code);
      if (!centroid || code.length !== 2) continue;
      const existing = byCountry.get(code);
      const isMoreSevere = level === "critical" && existing?.level !== "critical";
      const isNewer = !existing || Number(alert.time) >= existing.time;
      if (!existing || isMoreSevere || (existing.level === level && isNewer)) {
        byCountry.set(code, {
          code,
          name: centroid.name,
          lat: centroid.lat,
          lng: centroid.lng,
          level,
          datasource: String(alert.datasource || "unknown"),
          time: Number(alert.time) || 0,
          radiusMeters: centroid.radiusMeters,
        });
      }
    }

    return NextResponse.json({ outages: Array.from(byCountry.values()) });
  } catch (error) {
    console.error("internet-outages error:", error);
    return NextResponse.json({ outages: [] });
  }
}
