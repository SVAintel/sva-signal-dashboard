import { NextResponse } from "next/server";

// OpenSky Network's anonymous REST API provides free, global, near-real-time
// ADS-B aircraft positions with no API key required. However, OpenSky blocks
// (or silently empties) anonymous requests coming from cloud/datacenter IP
// ranges (Vercel, AWS, GCP, etc.) to curb abuse -- it's calibrated for
// residential IPs, so this worked from a home machine but returned empty
// states once deployed. Authenticating via OAuth2 client-credentials (a free
// OpenSky account) raises the quota and avoids that anonymous-tier IP
// blocking; anonymous access remains as a fallback if no credentials are
// configured. Each /states/all call costs 1 credit against a 4,000/day
// authenticated budget, so a 2-min cache window (max 720 calls/day, ~18% of
// budget) keeps data fresh with plenty of headroom. Unlike the naval layer
// (90s AIS WebSocket collection window), this is a single fast REST GET, so
// Next's fetch-level cache handles freshness on its own — no background
// timer/cron needed.
const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const OPENSKY_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const CACHE_SECONDS = 120;

export const dynamic = "force-dynamic";
export const revalidate = CACHE_SECONDS;

// Cached in the function's module scope so a warm serverless instance reuses
// the token across requests instead of re-authenticating every call.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getOpenSkyAccessToken(): Promise<string | null> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  try {
    const res = await fetch(OPENSKY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("OpenSky token request failed:", res.status);
      return null;
    }
    const data = await res.json();
    const token = typeof data?.access_token === "string" ? data.access_token : null;
    const expiresInSec = Number(data?.expires_in);
    if (!token) return null;
    // Refresh a little early (30s margin) so we never use a token right as it expires.
    const ttlMs = (Number.isFinite(expiresInSec) && expiresInSec > 30 ? expiresInSec - 30 : 270) * 1000;
    cachedToken = { value: token, expiresAt: Date.now() + ttlMs };
    return token;
  } catch (error) {
    console.error("OpenSky token fetch error:", error);
    return null;
  }
}

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
    const token = await getOpenSkyAccessToken();
    const res = await fetch(OPENSKY_URL, {
      next: { revalidate: CACHE_SECONDS },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
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
