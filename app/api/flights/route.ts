import { NextResponse } from "next/server";

// OpenSky Network's anonymous REST API provides free, global, near-real-time
// ADS-B aircraft positions with no API key required. Anonymous usage is
// capped at 400 credits/day and a global (no bounding box) /states/all query
// costs 4 credits per call (per OpenSky's published cost table), so a 15-min
// cache window keeps this comfortably under budget (~96 calls/day) while
// still feeling live. Unlike the naval layer (90s AIS WebSocket collection
// window), this is a single fast REST GET, so Next's fetch-level cache
// handles freshness on its own — no background timer/cron needed.
const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const CACHE_SECONDS = 900;

export const dynamic = "force-dynamic";
export const revalidate = CACHE_SECONDS;

interface Flight {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitude: number | null; // feet
  speed: number | null; // knots
  heading: number | null; // degrees, true track
  verticalRate: number | null; // m/s, +climb/-descend
  squawk: string | null;
}

// A global snapshot can carry 8,000-10,000+ aircraft at once, far more than
// the map's DOM-based marker renderer can handle smoothly. Cap to the
// freshest-reporting aircraft so the cap favors currently active
// transponders over ones about to drop out of coverage.
const MAX_FLIGHTS = 2000;

export async function GET() {
  try {
    const res = await fetch(OPENSKY_URL, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) {
      return NextResponse.json({ flights: [], note: `OpenSky fetch failed: ${res.status}` });
    }
    const data = await res.json();
    const states: unknown[] = Array.isArray(data?.states) ? data.states : [];

    const ranked = states
      .map((row) => {
        const s = row as unknown[];
        const lat = Number(s[6]);
        const lng = Number(s[5]);
        const onGround = !!s[8];
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || onGround) return null;

        const velocityMs = Number(s[9]);
        const headingDeg = Number(s[10]);
        const altitudeM = s[13] != null ? Number(s[13]) : s[7] != null ? Number(s[7]) : null;
        const verticalRateMs = s[11] != null ? Number(s[11]) : null;
        const lastContact = Number(s[4]) || 0;

        const flight: Flight = {
          icao24: String(s[0] || ""),
          callsign: String(s[1] || "").trim() || "Unknown",
          originCountry: String(s[2] || ""),
          lat,
          lng,
          altitude: altitudeM !== null && Number.isFinite(altitudeM) ? Math.round(altitudeM * 3.28084) : null,
          speed: Number.isFinite(velocityMs) ? Math.round(velocityMs * 1.94384) : null,
          heading: Number.isFinite(headingDeg) ? headingDeg : null,
          verticalRate: verticalRateMs !== null && Number.isFinite(verticalRateMs) ? verticalRateMs : null,
          squawk: (s[14] as string) || null,
        };
        return { flight, lastContact };
      })
      .filter((row): row is { flight: Flight; lastContact: number } => row !== null)
      .sort((a, b) => b.lastContact - a.lastContact)
      .slice(0, MAX_FLIGHTS);

    const flights = ranked.map((row) => row.flight);

    return NextResponse.json({ flights, time: data?.time || null });
  } catch (error) {
    console.error("flights error:", error);
    return NextResponse.json({ flights: [] });
  }
}
