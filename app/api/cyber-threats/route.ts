import { NextResponse } from "next/server";

// SANS Internet Storm Center / DShield: a free, no-API-key feed of the
// internet's most active attacking source IPs, aggregated from a global
// network of volunteer firewall/IDS sensor submissions. No signup required —
// unlike most cyber-threat-intel feeds (abuse.ch's ThreatFox/URLhaus now
// require a free account key), this one is fully open.
const DSHIELD_URL = "https://isc.sans.edu/api/sources/attacks/50?json";
// DShield reports raw IPs with no geolocation. ip-api.com's free batch
// endpoint (no key, up to 100 IPs/call, 45 calls/min) fills that gap. It's
// HTTP-only on the free tier, which is fine here since the call happens
// server-side in this route, not from the browser.
const GEO_BATCH_URL = "http://ip-api.com/batch?fields=status,country,lat,lon,query";

// DShield's "top attackers" list turns over a few times a day; 30 min keeps
// this fresh without re-running the geolocation batch too often.
export const dynamic = "force-dynamic";
export const revalidate = 1800;

interface CyberThreat {
  ip: string;
  lat: number;
  lng: number;
  country: string | null;
  attacks: number;
  reports: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

interface GeoResult {
  status: string;
  country?: string;
  lat?: number;
  lon?: number;
  query: string;
}

export async function GET() {
  try {
    const res = await fetch(DSHIELD_URL, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json({ threats: [], note: `DShield fetch failed: ${res.status}` });
    }
    const sources = await res.json();
    const attackers = Array.isArray(sources) ? sources : [];
    const ips = attackers
      .map((entry: any) => entry?.ip)
      .filter((ip: unknown): ip is string => typeof ip === "string" && ip.length > 0);

    if (ips.length === 0) return NextResponse.json({ threats: [] });

    const geoRes = await fetch(GEO_BATCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ips),
      next: { revalidate: 1800 },
    });
    const geoResults: GeoResult[] = geoRes.ok ? await geoRes.json() : [];
    const geoByIp = new Map<string, GeoResult>();
    for (const result of Array.isArray(geoResults) ? geoResults : []) {
      if (result?.status === "success" && typeof result?.query === "string") {
        geoByIp.set(result.query, result);
      }
    }

    const threats: CyberThreat[] = attackers
      .map((entry: any): CyberThreat | null => {
        const ip = entry?.ip;
        const geo = typeof ip === "string" ? geoByIp.get(ip) : undefined;
        if (!geo || typeof geo.lat !== "number" || typeof geo.lon !== "number") return null;
        return {
          ip,
          lat: geo.lat,
          lng: geo.lon,
          country: geo.country || null,
          attacks: Number(entry.attacks) || 0,
          reports: Number(entry.count) || 0,
          firstSeen: entry.firstseen || null,
          lastSeen: entry.lastseen || null,
        };
      })
      .filter((t: CyberThreat | null): t is CyberThreat => t !== null);

    return NextResponse.json({ threats });
  } catch (error) {
    console.error("cyber-threats error:", error);
    return NextResponse.json({ threats: [] });
  }
}
