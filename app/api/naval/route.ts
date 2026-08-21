import { NextResponse } from "next/server";
import WebSocket from "ws";
import fs from "fs";
import path from "path";

// Best-effort naval vessel + oil tanker layer via AISStream.io.
//
// IMPORTANT caveats (surfaced to the user before building this):
// - Military vessels routinely disable AIS for operational security, so this
//   will only ever show ships that are voluntarily broadcasting — mostly
//   support/auxiliary vessels, not active-duty warships underway.
// - AISStream is a free, community-fed, beta service with no uptime SLA.
// - Vercel serverless functions can't hold a permanent WebSocket connection
//   between requests, so each call opens a short-lived connection, listens
//   for a fixed window, and returns whatever snapshot arrived — then the
//   result is cached in memory so we aren't reconnecting on every page load.
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY || "";
// AIS "static data" messages (which carry the ship-type classification we
// filter on) are only broadcast roughly every ~6 minutes per vessel — far
// less often than position reports (every few seconds). A short window
// reliably sees plenty of positions but almost never catches a matching
// static-data message for the same ship, so real military-flagged vessels
// were being missed entirely. The user opted into a 30-min refresh cadence
// for this layer specifically to allow a much longer collection window,
// giving a realistic chance of pairing a position with its static data.
const COLLECT_WINDOW_MS = 90000;

// Route handlers on Vercel default to a 10s execution limit; raise it well
// past the collection window (Hobby plan supports up to 300s via maxDuration).
export const maxDuration = 100;
export const dynamic = "force-dynamic";

interface NavalVessel {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  course: number | null;
  speed: number | null;
  shipType: number | null;
  kind: "military" | "tanker";
}

const CACHE_MS = 30 * 60 * 1000; // 30 minutes — matches the client polling interval
const CACHE_FILE = path.join(process.cwd(), ".naval-cache.json");

type NavalCache = { data: NavalVessel[]; ts: number; outage?: boolean };

// GET requests must NEVER block on a live 90s AIS scan. Instead, a
// self-scheduling background refresh loop (re-armed every CACHE_MS) keeps a
// disk-backed snapshot warm, and requests just read whatever's cached. Disk
// persistence survives dev-server restarts; the globalThis singleton guards
// against Next.js dev hot-reload spawning duplicate refresh loops.
const g = globalThis as unknown as {
  __navalCache?: NavalCache | null;
  __navalRefreshing?: boolean;
  __navalTimer?: ReturnType<typeof setTimeout>;
};

function readCacheFromDisk(): NavalCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCacheToDisk(cache: NavalCache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch (error) {
    console.error("[naval] failed to write disk cache:", error);
  }
}

// AIS "Type of ship and cargo" code 35 = "Military ops" — the only official
// designation for warships/naval vessels that choose to self-identify.
const MILITARY_SHIP_TYPE = 35;
// AIS ship-type codes 80-89 cover the "Tanker" category (crude/product oil,
// chemical, and other liquid bulk carriers) — the closest official AIS
// designation to "oil tankers" without needing per-cargo classification
// data that isn't broadcast over AIS.
const isTankerShipType = (t: number | null) => t !== null && t >= 80 && t <= 89;

async function collectNavalVessels(): Promise<{ vessels: NavalVessel[]; outage: boolean }> {
  return new Promise((resolve) => {
    const positions = new Map<string, { lat: number; lng: number; course: number | null; speed: number | null }>();
    const staticData = new Map<string, { name: string; shipType: number | null }>();
    let settled = false;

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore close errors
      }
      const out: NavalVessel[] = [];
      for (const [mmsi, sd] of staticData.entries()) {
        const isMilitary = sd.shipType === MILITARY_SHIP_TYPE;
        const isTanker = isTankerShipType(sd.shipType);
        if (!isMilitary && !isTanker) continue;
        const pos = positions.get(mmsi);
        if (!pos) continue;
        out.push({
          mmsi,
          name: sd.name || `MMSI ${mmsi}`,
          lat: pos.lat,
          lng: pos.lng,
          course: pos.course,
          speed: pos.speed,
          shipType: sd.shipType,
          kind: isMilitary ? "military" : "tanker",
        });
      }
      // Zero position AND static reports means AISStream never sent any AIS
      // traffic at all during the whole window — not "no matching vessels",
      // but the feed itself being empty (their beta service has had known
      // outages where connections succeed but no data is ever streamed).
      // Distinguish this from a legitimate scan that saw traffic but no
      // military/tanker matches, so the UI can surface an honest status.
      const outage = positions.size === 0 && staticData.size === 0;
      console.log(`[naval] AIS window closed: ${positions.size} position reports, ${staticData.size} static reports, ${out.length} matches${outage ? " (no AIS traffic received — possible feed outage)" : ""}`);
      resolve({ vessels: out, outage });
    };

    const timer = setTimeout(finish, COLLECT_WINDOW_MS);

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          APIKey: AISSTREAM_API_KEY,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        })
      );
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const mmsi = String(msg?.MetaData?.MMSI || "");
        if (!mmsi) return;

        if (msg.MessageType === "PositionReport") {
          const report = msg.Message?.PositionReport;
          if (!report) return;
          positions.set(mmsi, {
            lat: report.Latitude,
            lng: report.Longitude,
            course: typeof report.Cog === "number" ? report.Cog : null,
            speed: typeof report.Sog === "number" ? report.Sog : null,
          });
        } else if (msg.MessageType === "ShipStaticData") {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          staticData.set(mmsi, {
            name: (sd.ShipName || "").trim(),
            shipType: typeof sd.Type === "number" ? sd.Type : null,
          });
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("error", () => {
      clearTimeout(timer);
      finish();
    });

    ws.on("close", () => {
      clearTimeout(timer);
      finish();
    });
  });
}

export async function GET() {
  if (!AISSTREAM_API_KEY) {
    return NextResponse.json({ vessels: [], note: "AISSTREAM_API_KEY not configured" });
  }

  if (g.__navalCache === undefined) {
    g.__navalCache = readCacheFromDisk();
  }

  ensureRefreshLoopStarted();

  const cache = g.__navalCache;
  const ageMs = cache ? Date.now() - cache.ts : null;
  return NextResponse.json({
    vessels: cache?.data || [],
    lastUpdated: cache?.ts || null,
    stale: ageMs !== null && ageMs > CACHE_MS,
    refreshing: !!g.__navalRefreshing,
    outage: !!cache?.outage,
  });
}

async function runRefresh() {
  if (g.__navalRefreshing) return;
  g.__navalRefreshing = true;
  try {
    const { vessels, outage } = await collectNavalVessels();
    const cache: NavalCache = { data: vessels, ts: Date.now(), outage };
    g.__navalCache = cache;
    writeCacheToDisk(cache);
  } catch (error) {
    console.error("[naval] background refresh error:", error);
  } finally {
    g.__navalRefreshing = false;
  }
}

function ensureRefreshLoopStarted() {
  if (g.__navalTimer) return; // loop already running (singleton across hot-reloads)

  const cache = g.__navalCache;
  const ageMs = cache ? Date.now() - cache.ts : Infinity;
  const initialDelay = ageMs >= CACHE_MS ? 0 : CACHE_MS - ageMs;

  const tick = async () => {
    await runRefresh();
    g.__navalTimer = setTimeout(tick, CACHE_MS);
  };

  g.__navalTimer = setTimeout(tick, initialDelay);
}
