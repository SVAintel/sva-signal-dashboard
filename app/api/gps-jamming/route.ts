import { NextResponse } from "next/server";
import { cellToLatLng, isValidCell } from "h3-js";

// GPS/GNSS interference data from gpsjam.org — a free, no-auth source derived
// from ADS-B Exchange aircraft GPS-quality reports (same source World Monitor
// uses for its "GPS Jamming" layer). Data is published as a daily CSV of H3
// (resolution-4) hexes: hex,count_good_aircraft,count_bad_aircraft.
const BASE_URL = "https://gpsjam.org/data";
const MIN_AIRCRAFT = 3; // drop hexes with too few samples to be meaningful

// The manifest lists every available date; only the latest row matters here.
// It changes daily, so a short revalidate window is enough to pick up a new
// day promptly without hammering the free feed.
export const dynamic = "force-dynamic";
export const revalidate = 10800; // 3h

interface GpsJamHex {
  h3: string;
  lat: number;
  lng: number;
  level: "medium" | "high";
  pct: number;
  affectedAircraft: number;
  totalAircraft: number;
}

async function fetchText(url: string, revalidateSeconds: number): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SVASignalDashboard/1.0)" },
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Latest available date is the last row of the manifest (date,suspect,num_bad_hexes).
async function getLatestDate(): Promise<string> {
  const csv = await fetchText(`${BASE_URL}/manifest.csv`, 3600);
  const lines = csv.trim().split("\n");
  const last = lines[lines.length - 1];
  const date = last.split(",")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Unexpected manifest tail: ${last.slice(0, 80)}`);
  return date;
}

function parseHexes(csv: string): GpsJamHex[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2 || !lines[0].includes("hex")) return [];

  const results: GpsJamHex[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 3) continue;

    const hex = parts[0];
    const good = parseInt(parts[1], 10);
    const bad = parseInt(parts[2], 10);
    if (!Number.isFinite(good) || !Number.isFinite(bad)) continue;

    const total = good + bad;
    if (total < MIN_AIRCRAFT) continue;

    const pctRaw = (bad / total) * 100;
    let level: "medium" | "high";
    if (pctRaw > 10) level = "high";
    else if (pctRaw >= 2) level = "medium";
    else continue; // low interference — not worth rendering

    if (!isValidCell(hex)) continue;
    let lat: number, lng: number;
    try {
      const [lt, ln] = cellToLatLng(hex);
      lat = Math.round(lt * 1e5) / 1e5;
      lng = Math.round(ln * 1e5) / 1e5;
    } catch {
      continue;
    }

    results.push({
      h3: hex,
      lat,
      lng,
      level,
      pct: Math.round(pctRaw * 10) / 10,
      affectedAircraft: bad,
      totalAircraft: total,
    });
  }

  // Worst-first: high before medium, then by interference % descending.
  results.sort((a, b) => {
    if (a.level !== b.level) return a.level === "high" ? -1 : 1;
    return b.pct - a.pct;
  });

  // A global daily snapshot can carry several thousand medium/high hexes —
  // cap to the worst offenders (already worst-first-sorted) to keep marker
  // rendering smooth, same guardrail used for the wildfires layer.
  return results.slice(0, 2500);
}

export async function GET() {
  try {
    const date = await getLatestDate();
    const csv = await fetchText(`${BASE_URL}/${date}-h3_4.csv`, 21600); // 6h — data itself only updates once/day
    const hexes = parseHexes(csv);
    return NextResponse.json({
      date,
      source: "gpsjam.org",
      attribution: "Data derived from ADS-B Exchange via gpsjam.org",
      hexes,
    });
  } catch (error) {
    console.error("gps-jamming error:", error);
    return NextResponse.json({ date: null, source: "gpsjam.org", hexes: [] });
  }
}
