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

      // Single-row cache for the fleet-tracker API response itself (distinct
      // from fleet_snapshots' append-only history table above). Vercel's
      // serverless filesystem is ephemeral, so the route's previous
      // disk-file cache (.fleet-tracker-cache.json) silently failed to
      // persist between invocations in production, causing a re-scrape of
      // USNI on effectively every cold start instead of the intended 12h
      // cadence. This table gives the route a cache that actually survives
      // across invocations/instances.
      await db.query(`
        CREATE TABLE IF NOT EXISTS fleet_tracker_cache (
          id INTEGER PRIMARY KEY DEFAULT 1,
          groups JSONB NOT NULL,
          source_url TEXT,
          source_title TEXT,
          published_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT fleet_tracker_cache_singleton CHECK (id = 1)
        );
      `);

      // Flags a curated country-details.ts profile as possibly out of date
      // (e.g. a leader captured/killed/replaced, a war starting/ending, a
      // government collapsing) based on a periodic AI comparison against the
      // live signal feed — see lib/country-staleness-check.ts. One row per
      // country; re-checks upsert (refresh the issue/evidence) or clear it
      // once the underlying country-details.ts entry is updated to match.
      await db.query(`
        CREATE TABLE IF NOT EXISTS country_staleness_flags (
          country TEXT PRIMARY KEY,
          issue TEXT NOT NULL,
          evidence TEXT,
          detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Generic single-value-per-key JSON cache for routes that just need a
      // durable "last good response" surviving Vercel's ephemeral filesystem
      // (naval, market-health, Alpha Vantage quotes) without a bespoke table
      // each — same durability fix as fleet_tracker_cache above, generalized.
      await db.query(`
        CREATE TABLE IF NOT EXISTS app_cache (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Needed for gen_random_uuid() below. Neon/Vercel Postgres roles are
      // allowed to create this extension; wrapped in its own try/catch since
      // some Postgres hosts restrict extension creation to superusers and we
      // don't want that alone to break the rest of schema setup.
      try {
        await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      } catch (err) {
        console.error("CREATE EXTENSION pgcrypto failed (continuing):", err);
      }

      // User accounts (email/password auth via NextAuth Credentials
      // provider — see lib/auth.ts). Passwords are bcrypt hashes, never
      // plaintext. Email is the natural unique key/login identifier.
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // One row per user, storing their saved dashboard preferences as a
      // single JSON blob (category filters, time range, sidebar width,
      // ambient volume, etc.) rather than a bespoke column per preference —
      // this list is expected to keep growing and none of it needs to be
      // queried/filtered on individually.
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_prefs (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
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

export interface FleetTrackerCache {
  groups: FleetGroup[];
  sourceUrl: string;
  sourceTitle: string;
  publishedAt: string | null;
  updatedAt: string;
}

// Reads the single cached fleet-tracker API response, if any. Returns null on
// a cache miss or any DB error (e.g. no Postgres connection string configured
// in local dev) so the route can fall back to a fresh scrape either way.
export async function getFleetTrackerCache(): Promise<FleetTrackerCache | null> {
  try {
    await ensureSchema();
    const db = getPool();
    const { rows } = await db.query(
      `SELECT groups, source_url, source_title, published_at, updated_at
       FROM fleet_tracker_cache WHERE id = 1;`
    );
    const row = rows[0];
    if (!row) return null;
    return {
      groups: row.groups as FleetGroup[],
      sourceUrl: row.source_url,
      sourceTitle: row.source_title,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error("getFleetTrackerCache failed:", err);
    return null;
  }
}

// Upserts the single cached fleet-tracker API response. Best-effort — a
// write failure here shouldn't take down the route, which can still serve
// the freshly-scraped result for the current request even if it couldn't be
// persisted for the next cold start.
export async function setFleetTrackerCache(cache: {
  groups: FleetGroup[];
  sourceUrl: string;
  sourceTitle: string;
  publishedAt: string | null;
}): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    await db.query(
      `INSERT INTO fleet_tracker_cache (id, groups, source_url, source_title, published_at, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET
         groups = EXCLUDED.groups,
         source_url = EXCLUDED.source_url,
         source_title = EXCLUDED.source_title,
         published_at = EXCLUDED.published_at,
         updated_at = now();`,
      [JSON.stringify(cache.groups), cache.sourceUrl, cache.sourceTitle, cache.publishedAt]
    );
  } catch (err) {
    console.error("setFleetTrackerCache failed:", err);
  }
}

// Generic durable cache for routes that only need "last good JSON response,
// keyed by name" (naval AIS snapshot, market-health quotes, Alpha Vantage
// symbol quotes) — replaces per-route disk-file caches that silently failed
// to persist on Vercel's ephemeral filesystem outside /tmp.
export async function getAppCache<T = unknown>(key: string): Promise<{ value: T; updatedAt: string } | null> {
  try {
    await ensureSchema();
    const db = getPool();
    const { rows } = await db.query(`SELECT value, updated_at FROM app_cache WHERE key = $1;`, [key]);
    const row = rows[0];
    if (!row) return null;
    return { value: row.value as T, updatedAt: row.updated_at };
  } catch (err) {
    console.error(`getAppCache(${key}) failed:`, err);
    return null;
  }
}

export async function setAppCache(key: string, value: unknown): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    await db.query(
      `INSERT INTO app_cache (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();`,
      [key, JSON.stringify(value)]
    );
  } catch (err) {
    console.error(`setAppCache(${key}) failed:`, err);
  }
}

export interface CountryStalenessFlag {
  country: string;
  issue: string;
  evidence: string | null;
  detectedAt: string;
}

// Active (unresolved) country-data staleness flags, most recently detected
// first. Read-only and cheap — safe for the frontend to poll directly,
// unlike the check itself (see lib/country-staleness-check.ts) which makes a
// Gemini call and should only run from the daily cron.
export async function getActiveCountryStalenessFlags(): Promise<CountryStalenessFlag[]> {
  try {
    await ensureSchema();
    const db = getPool();
    const { rows } = await db.query(
      `SELECT country, issue, evidence, detected_at FROM country_staleness_flags ORDER BY detected_at DESC;`
    );
    return rows.map((r) => ({
      country: r.country,
      issue: r.issue,
      evidence: r.evidence,
      detectedAt: r.detected_at,
    }));
  } catch (err) {
    console.error("getActiveCountryStalenessFlags failed:", err);
    return [];
  }
}

// Upserts a staleness flag for a country (new issue text replaces the old
// one on re-detection, e.g. a follow-on development). Best-effort.
export async function setCountryStalenessFlag(country: string, issue: string, evidence: string): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    await db.query(
      `INSERT INTO country_staleness_flags (country, issue, evidence, detected_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (country) DO UPDATE SET issue = EXCLUDED.issue, evidence = EXCLUDED.evidence, detected_at = now();`,
      [country, issue, evidence]
    );
  } catch (err) {
    console.error("setCountryStalenessFlag failed:", err);
  }
}

// Clears a country's flag — called when a re-check finds the curated profile
// no longer conflicts with live signals (e.g. after a developer updates
// country-details.ts to match reality, as done for Iran and Venezuela).
export async function clearCountryStalenessFlag(country: string): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    await db.query(`DELETE FROM country_staleness_flags WHERE country = $1;`, [country]);
  } catch (err) {
    console.error("clearCountryStalenessFlag failed:", err);
  }
}

// Prevents old, never-reviewed flags from accumulating forever if a country
// stops appearing in the live signal feed before anyone acts on its flag.
export async function pruneOldCountryStalenessFlags(days: number): Promise<void> {
  try {
    await ensureSchema();
    const db = getPool();
    await db.query(
      `DELETE FROM country_staleness_flags WHERE detected_at < now() - ($1::text || ' days')::interval;`,
      [days]
    );
  } catch (err) {
    console.error("pruneOldCountryStalenessFlags failed:", err);
  }
}

// --- User accounts + preferences ---------------------------------------
// Unlike the best-effort caches above, these deliberately let errors
// propagate to the caller (API routes) instead of swallowing them: a failed
// signup or prefs save needs to be reported to the user, not silently
// treated as success.

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Throws (unique violation, code 23505) if the email is already registered —
// the signup route maps that into a friendly "already registered" message.
export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     RETURNING id, email, password_hash, created_at;`,
    [email.toLowerCase().trim(), passwordHash]
  );
  const row = rows[0];
  return { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query(
    `SELECT id, email, password_hash, created_at FROM users WHERE email = $1;`,
    [email.toLowerCase().trim()]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at };
}

// Saved dashboard preferences are a free-form JSON blob — see components
// that read/write this (Dashboard.tsx) for the actual shape (category
// filters, time range, sidebar width, ambient volume, etc.). Kept untyped
// here deliberately so adding a new persisted preference never requires a
// migration.
export async function getUserPrefs(userId: string): Promise<Record<string, unknown> | null> {
  await ensureSchema();
  const db = getPool();
  const { rows } = await db.query(`SELECT prefs FROM user_prefs WHERE user_id = $1;`, [userId]);
  const row = rows[0];
  if (!row) return null;
  return row.prefs as Record<string, unknown>;
}

export async function setUserPrefs(userId: string, prefs: Record<string, unknown>): Promise<void> {
  await ensureSchema();
  const db = getPool();
  await db.query(
    `INSERT INTO user_prefs (user_id, prefs, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET prefs = EXCLUDED.prefs, updated_at = now();`,
    [userId, JSON.stringify(prefs)]
  );
}

