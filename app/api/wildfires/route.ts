import { NextResponse } from "next/server";

// NASA FIRMS (Fire Information for Resource Management System) publishes a
// public, no-API-key rolling 24h CSV of global active fire detections from
// the MODIS satellite instrument. This is live/real data — unlike cables,
// pipelines, and military bases, fire activity changes daily, so it's
// fetched live (with a cache) rather than snapshotted statically.
const FIRMS_URL =
  "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv";

// FIRMS updates a handful of times per day as satellite passes come in —
// an hourly revalidate window is more than fresh enough and keeps us well
// under any fair-use concerns for the public feed.
// This route has no dynamic API usage of its own, so without force-dynamic
// Next.js treats it as a STATIC route handler that relies entirely on ISR
// background revalidation to refresh — unreliable in production. force-dynamic
// makes the handler run per-request while the inner fetch keeps its own cache.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface WildfireFeature {
  lat: number;
  lng: number;
  brightness: number;
  frp: number; // Fire Radiative Power (MW) — a proxy for fire intensity/size
  confidence: string;
  acqDate: string;
  acqTime: string;
  daynight: string;
}

function parseCsv(csv: string): WildfireFeature[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const idx = (col: string) => header.indexOf(col);

  const latIdx = idx("latitude");
  const lngIdx = idx("longitude");
  const brightIdx = idx("brightness");
  const frpIdx = idx("frp");
  const confIdx = idx("confidence");
  const dateIdx = idx("acq_date");
  const timeIdx = idx("acq_time");
  const dayIdx = idx("daynight");

  const fires: WildfireFeature[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < header.length) continue;

    const lat = Number(cols[latIdx]);
    const lng = Number(cols[lngIdx]);
    const frp = Number(cols[frpIdx]);
    if (isNaN(lat) || isNaN(lng) || isNaN(frp)) continue;

    fires.push({
      lat,
      lng,
      brightness: Number(cols[brightIdx]) || 0,
      frp,
      confidence: cols[confIdx] || "",
      acqDate: cols[dateIdx] || "",
      acqTime: cols[timeIdx] || "",
      daynight: cols[dayIdx] || "",
    });
  }

  // A raw 24h global feed can be tens of thousands of detections — far too
  // many to usefully render as map markers. Keep only the most intense
  // (highest FRP) fires, which correspond to significant/large fire activity
  // rather than every small heat signature.
  return fires.sort((a, b) => b.frp - a.frp).slice(0, 400);
}

export async function GET() {
  try {
    const res = await fetch(FIRMS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ fires: [], note: `FIRMS fetch failed: ${res.status}` });
    }
    const csv = await res.text();
    const fires = parseCsv(csv);
    return NextResponse.json({ fires });
  } catch (error) {
    console.error("wildfires error:", error);
    return NextResponse.json({ fires: [] });
  }
}
