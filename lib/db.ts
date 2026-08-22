import { Pool } from "pg";
import crypto from "crypto";
import type { Event } from "@/lib/types";
import type { FleetGroup } from "@/lib/data/fleet-group-type";

// Lightweight historical store backing the region/weekly-brief feature.
// Vercel's serverless filesystem is ephemeral (nothing written to disk
// survives between invocations), so this uses the project's Neon/Vercel
// Postgres database instead. Schema is created lazily on first use rather
// than via a separate migration step, since this is a small, low-write-volume
// dataset (event polls every ~30min, fleet snapshots roughly weekly).
//
// Uses plain node-postgres (`pg`) rather than `@vercel/postgres` because the
// latter's `sql` template tag requires a "-pooler" formatted Neon connection
// string specifically; `pg`'s Pool works with whichever connection string
// Vercel injects (POSTGRES_URL / DATABASE_URL) without that constraint, at
// the cost of not using Neon's HTTP-based edge-friendly pooling — acceptable
// here since these routes already run with `dynamic = "force-dynamic"` on
// Node.js serverless functions, not the edge runtime.
const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!connectionString) {
      throw new Error("No Postgres connection string found (POSTGRES_URL / DATABASE_URL)");
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

// Lightweight historical store backing the region/weekly-brief feature.
// Vercel's serverless filesystem is ephemeral (nothing written to disk
// survives between invocations), so this uses the project's Neon/Vercel
// Postgres database instead. Schema is created lazily on first use rather
// than via a separate migration step, since this is a small, low-write-volume
// dataset (event polls every ~30min, fleet snapshots roughly weekly).

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS event_snapshots (
          dedup_key TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          source TEXT NOT NULL,
          url TEXT,
          description TEXT,
          ai_notes TEXT,
          confidence TEXT,
          event_timestamp TIMESTAMPTZ,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS event_snapshots_first_seen_idx ON event_snapshots (first_seen_at);`);
      await db.query(`CREATE INDEX IF NOT EXISTS event_snapshots_category_idx ON event_snapshots (category);`);

      await db.query(`
        CREATE TABLE IF NOT EXISTS fleet_snapshots (
          id SERIAL PRIMARY KEY,
          region_id TEXT NOT NULL,
          region TEXT NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          group_name TEXT,
          ships JSONB NOT NULL,
          capabilities TEXT,
          mission_set TEXT,
          outlook TEXT,
          source_url TEXT,
          published_at TIMESTAMPTZ,
          captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (region_id, published_at)
        );
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS fleet_snapshots_captured_idx ON fleet_snapshots (captured_at);`);
    })();
  }
  return schemaReady;
}

function dedupKey(source: string, title: string): string {
  return crypto.createHash("sha1").update(`${source}::${title}`).digest("hex");
}

// Upsert the latest event poll into history. Cheap/idempotent: events seen
// again just bump last_seen_at, genuinely new ones get inserted. Also prunes
// anything older than the retention window so the table doesn't grow
// unbounded (we only need a rolling ~2 weeks for the weekly-brief feature).
export async function recordEventSnapshot(events: Event[]): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    for (const evt of events) {
      const key = dedupKey(evt.source, evt.title);
      await db.query(
        `INSERT INTO event_snapshots (
          dedup_key, title, category, lat, lng, source, url, description,
          ai_notes, confidence, event_timestamp, first_seen_at, last_seen_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
        ON CONFLICT (dedup_key) DO UPDATE SET last_seen_at = now();`,
        [
          key,
          evt.title,
          evt.category,
          evt.location.lat,
          evt.location.lng,
          evt.source,
          evt.url ?? null,
          evt.description ?? null,
          evt.aiNotes ?? null,
          evt.confidence ?? null,
          evt.timestamp,
        ]
      );
    }
    await db.query(`DELETE FROM event_snapshots WHERE first_seen_at < now() - interval '21 days';`);
  } catch (err) {
    // History is a best-effort enrichment layer — never let a DB hiccup take
    // down the live event feed that depends on this same route.
    console.error("recordEventSnapshot failed:", err);
  }
}

export interface EventHistoryRow {
  title: string;
  category: string;
  lat: number;
  lng: number;
  source: string;
  url: string | null;
  description: string | null;
  eventTimestamp: string | null;
  firstSeenAt: string;
}

export async function getRecentEvents(days: number): Promise<EventHistoryRow[]> {
  try {
    await ensureSchema();
    const db = getPool();
    const { rows } = await db.query(
      `SELECT title, category, lat, lng, source, url, description, event_timestamp, first_seen_at
       FROM event_snapshots
       WHERE first_seen_at > now() - ($1::text || ' days')::interval
       ORDER BY first_seen_at DESC
       LIMIT 500;`,
      [days]
    );
    return rows.map((r) => ({
      title: r.title,
      category: r.category,
      lat: Number(r.lat),
      lng: Number(r.lng),
      source: r.source,
      url: r.url,
      description: r.description,
      eventTimestamp: r.event_timestamp,
      firstSeenAt: r.first_seen_at,
    }));
  } catch (err) {
    // History is a best-effort enrichment layer (e.g. unavailable in local dev
    // without a real Postgres connection string) — never let it 500 the caller.
    console.error("getRecentEvents failed:", err);
    return [];
  }
}

// Append (not overwrite) each scraped USNI edition, keyed by region+published
// date so re-scraping the same edition doesn't create duplicate rows.
export async function recordFleetSnapshot(
  groups: FleetGroup[],
  sourceUrl: string,
  publishedAt: string | null
): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    for (const g of groups) {
      await db.query(
        `INSERT INTO fleet_snapshots (
          region_id, region, lat, lng, group_name, ships, capabilities,
          mission_set, outlook, source_url, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (region_id, published_at) DO NOTHING;`,
        [
          g.id,
          g.region,
          g.lat,
          g.lng,
          g.groupName,
          JSON.stringify(g.ships),
          g.capabilities,
          g.missionSet,
          g.outlook,
          sourceUrl,
          publishedAt,
        ]
      );
    }
    await db.query(`DELETE FROM fleet_snapshots WHERE captured_at < now() - interval '60 days';`);
  } catch (err) {
    console.error("recordFleetSnapshot failed:", err);
  }
}

export interface FleetHistoryRow {
  regionId: string;
  region: string;
  groupName: string | null;
  ships: string[];
  capabilities: string | null;
  missionSet: string | null;
  outlook: string | null;
  publishedAt: string | null;
}

export async function getRecentFleetSnapshots(days: number): Promise<FleetHistoryRow[]> {
  try {
    await ensureSchema();
    const db = getPool();
    const { rows } = await db.query(
      `SELECT region_id, region, group_name, ships, capabilities, mission_set, outlook, published_at
       FROM fleet_snapshots
       WHERE captured_at > now() - ($1::text || ' days')::interval
       ORDER BY captured_at DESC
       LIMIT 200;`,
      [days]
    );
    return rows.map((r) => ({
      regionId: r.region_id,
      region: r.region,
      groupName: r.group_name,
      ships: r.ships as string[],
      capabilities: r.capabilities,
      missionSet: r.mission_set,
      outlook: r.outlook,
      publishedAt: r.published_at,
    }));
  } catch (err) {
    console.error("getRecentFleetSnapshots failed:", err);
    return [];
  }
}
