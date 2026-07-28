import { NextResponse } from "next/server";

// NOAA's National Hurricane Center publishes a free, no-API-key JSON feed
// of currently active tropical cyclones. Coverage note: NHC's remit covers
// the Atlantic and Eastern/Central Pacific basins only — it does NOT include
// Western Pacific typhoons or Indian Ocean cyclones, so this is a partial
// "storms we know about" layer, not truly global. Flagged in the UI.
const NHC_URL = "https://www.nhc.noaa.gov/CurrentStorms.json";

// Advisories are issued roughly every 6h (more often near landfall), so a
// 15-min revalidate window is frequent enough without hammering NOAA.
// This route has no dynamic API usage of its own, so without force-dynamic
// Next.js treats it as a STATIC route handler that relies entirely on ISR
// background revalidation to refresh — unreliable in production. force-dynamic
// makes the handler run per-request while the inner fetch keeps its own cache.
export const dynamic = "force-dynamic";
export const revalidate = 900;

interface StormFeature {
  id: string;
  name: string;
  classification: string;
  lat: number;
  lng: number;
  intensity: number | null; // max sustained wind, knots
  pressure: number | null; // millibars
  movementDir: number | null;
  movementSpeed: number | null;
  advisoryUrl: string | null;
  lastUpdate: string | null;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  HU: "Hurricane",
  TS: "Tropical Storm",
  TD: "Tropical Depression",
  STD: "Subtropical Depression",
  STS: "Subtropical Storm",
  PTC: "Post-Tropical Cyclone",
};

export async function GET() {
  try {
    const res = await fetch(NHC_URL, { next: { revalidate: 900 } });
    if (!res.ok) {
      return NextResponse.json({ storms: [], note: `NHC fetch failed: ${res.status}` });
    }
    const data = await res.json();
    const activeStorms = Array.isArray(data?.activeStorms) ? data.activeStorms : [];

    const storms: StormFeature[] = activeStorms
      .map((s: any) => {
        const lat = Number(s.latitudeNumeric);
        const lng = Number(s.longitudeNumeric);
        if (isNaN(lat) || isNaN(lng)) return null;

        return {
          id: String(s.id || `${s.name}-${lat}`),
          name: `${CLASSIFICATION_LABELS[s.classification] || s.classification || "Storm"} ${s.name || ""}`.trim(),
          classification: s.classification || "",
          lat,
          lng,
          intensity: s.intensity != null ? Number(s.intensity) : null,
          pressure: s.pressure != null ? Number(s.pressure) : null,
          movementDir: s.movementDir != null ? Number(s.movementDir) : null,
          movementSpeed: s.movementSpeed != null ? Number(s.movementSpeed) : null,
          advisoryUrl: s.publicAdvisory?.url || null,
          lastUpdate: s.lastUpdate || null,
        };
      })
      .filter((s: StormFeature | null): s is StormFeature => s !== null);

    return NextResponse.json({ storms });
  } catch (error) {
    console.error("storms error:", error);
    return NextResponse.json({ storms: [] });
  }
}
